'use server';

/**
 * Voice Agents Server Actions
 *
 * Server actions for managing voice agents and calls.
 */

import { revalidatePath } from 'next/cache';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import {
  getElevenLabsClient,
  type CreateAgentParams,
  type ElevenLabsAgentListItem,
} from '@/lib/elevenlabs/client';
import type {
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
  VoiceAgentSettings,
} from '@/lib/supabase/types';

// =============================================================================
// TYPES
// =============================================================================

export type VoiceAgent = Tables<'voice_agents'>;
export type VoiceCall = Tables<'voice_calls'>;

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface CreateVoiceAgentInput {
  name: string;
  voiceId: string;
  language?: string;
  systemPrompt: string;
  firstMessage: string;
  settings?: Partial<VoiceAgentSettings>;
}

interface InitiateCallInput {
  voiceAgentId: string;
  customerId: string;
  debtCaseId?: string;
  phoneNumber: string;
  customFirstMessage?: string;
}

// =============================================================================
// VOICE AGENTS
// =============================================================================

/**
 * Get all voice agents for the current company
 */
export async function getVoiceAgents(): Promise<ActionResult<VoiceAgent[]>> {
  try {
    const adminClient = await createAdminClient();

    // For demo: get all voice agents for the demo company
    // TODO: Replace with proper user-based filtering after fixing RLS
    const DEMO_COMPANY_ID = '00000000-0000-0000-0000-000000000001';

    const { data, error } = await adminClient
      .from('voice_agents')
      .select('*')
      .eq('company_id', DEMO_COMPANY_ID)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: data ?? [] };
  } catch (error) {
    console.error('Error getting voice agents:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Get a single voice agent by ID
 */
export async function getVoiceAgent(
  agentId: string
): Promise<ActionResult<VoiceAgent>> {
  try {
    const supabase = await createClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'No autenticado' };
    }

    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.user.id)
      .single();

    if (!userData) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    const { data, error } = await supabase
      .from('voice_agents')
      .select('*')
      .eq('id', agentId)
      .eq('company_id', userData.company_id)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    if (!data) {
      return { success: false, error: 'Agente no encontrado' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error getting voice agent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Create a new voice agent
 */
export async function createVoiceAgent(
  input: CreateVoiceAgentInput
): Promise<ActionResult<VoiceAgent>> {
  try {
    const supabase = await createClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'No autenticado' };
    }

    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.user.id)
      .single();

    if (!userData) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    // Create agent in ElevenLabs
    const elevenLabs = getElevenLabsClient();
    const elevenLabsAgentId = await elevenLabs.createAgent({
      name: input.name,
      voiceId: input.voiceId,
      language: input.language ?? 'es',
      systemPrompt: input.systemPrompt,
      firstMessage: input.firstMessage,
      settings: input.settings,
    });

    // Default settings
    const defaultSettings: VoiceAgentSettings = {
      maxCallDuration: 300,
      temperature: 0.5,
      stability: 0.5,
      similarityBoost: 0.75,
      enableTranscription: true,
      enableRecording: true,
    };

    // Create agent in database
    const agentData: TablesInsert<'voice_agents'> = {
      company_id: userData.company_id,
      name: input.name,
      elevenlabs_agent_id: elevenLabsAgentId,
      voice_id: input.voiceId,
      language: input.language ?? 'es',
      system_prompt: input.systemPrompt,
      first_message: input.firstMessage,
      settings: (input.settings ?? defaultSettings) as unknown as Json,
      is_active: true,
    };

    const { data, error } = await supabase
      .from('voice_agents')
      .insert(agentData)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/voice-agents');
    return { success: true, data };
  } catch (error) {
    console.error('Error creating voice agent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Update a voice agent
 */
export async function updateVoiceAgent(
  agentId: string,
  updates: Partial<CreateVoiceAgentInput>
): Promise<ActionResult<VoiceAgent>> {
  try {
    const supabase = await createClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'No autenticado' };
    }

    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.user.id)
      .single();

    if (!userData) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    // Get current agent
    const { data: currentAgent } = await supabase
      .from('voice_agents')
      .select('*')
      .eq('id', agentId)
      .eq('company_id', userData.company_id)
      .single();

    if (!currentAgent) {
      return { success: false, error: 'Agente no encontrado' };
    }

    // Update in ElevenLabs if needed
    if (currentAgent.elevenlabs_agent_id) {
      const elevenLabs = getElevenLabsClient();
      await elevenLabs.updateAgent(currentAgent.elevenlabs_agent_id, {
        name: updates.name,
        systemPrompt: updates.systemPrompt,
        firstMessage: updates.firstMessage,
        language: updates.language,
      });
    }

    // Update in database
    const currentSettings = (currentAgent.settings ?? {}) as unknown as VoiceAgentSettings;
    const mergedSettings = updates.settings
      ? ({ ...currentSettings, ...updates.settings } as unknown as Json)
      : undefined;

    const updateData = {
      ...(updates.name && { name: updates.name }),
      ...(updates.voiceId && { voice_id: updates.voiceId }),
      ...(updates.language && { language: updates.language }),
      ...(updates.systemPrompt && { system_prompt: updates.systemPrompt }),
      ...(updates.firstMessage && { first_message: updates.firstMessage }),
      ...(mergedSettings && { settings: mergedSettings }),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('voice_agents')
      .update(updateData)
      .eq('id', agentId)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/voice-agents');
    revalidatePath(`/voice-agents/${agentId}`);
    return { success: true, data };
  } catch (error) {
    console.error('Error updating voice agent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Delete a voice agent (soft delete)
 */
export async function deleteVoiceAgent(
  agentId: string
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'No autenticado' };
    }

    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.user.id)
      .single();

    if (!userData) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    // Get current agent
    const { data: currentAgent } = await supabase
      .from('voice_agents')
      .select('elevenlabs_agent_id')
      .eq('id', agentId)
      .eq('company_id', userData.company_id)
      .single();

    if (!currentAgent) {
      return { success: false, error: 'Agente no encontrado' };
    }

    // Delete from ElevenLabs
    if (currentAgent.elevenlabs_agent_id) {
      try {
        const elevenLabs = getElevenLabsClient();
        await elevenLabs.deleteAgent(currentAgent.elevenlabs_agent_id);
      } catch (err) {
        console.error('Failed to delete from ElevenLabs:', err);
      }
    }

    // Soft delete in database
    const { error } = await supabase
      .from('voice_agents')
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false,
      })
      .eq('id', agentId);

    if (error) throw error;

    revalidatePath('/voice-agents');
    return { success: true };
  } catch (error) {
    console.error('Error deleting voice agent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// =============================================================================
// VOICE CALLS
// =============================================================================

/**
 * Initiate an outbound call
 */
export async function initiateCall(
  input: InitiateCallInput
): Promise<ActionResult<VoiceCall>> {
  try {
    const adminClient = await createAdminClient();
    const DEMO_COMPANY_ID = '00000000-0000-0000-0000-000000000001';

    // Get voice agent
    const { data: agent } = await adminClient
      .from('voice_agents')
      .select('*')
      .eq('id', input.voiceAgentId)
      .eq('company_id', DEMO_COMPANY_ID)
      .single();

    if (!agent?.elevenlabs_agent_id) {
      return { success: false, error: 'Agente no encontrado o no configurado' };
    }

    // Get company info
    const { data: company } = await adminClient
      .from('companies')
      .select('*')
      .eq('id', DEMO_COMPANY_ID)
      .single();

    if (!company) {
      return { success: false, error: 'Empresa no encontrada' };
    }

    // Get customer info
    const { data: customer } = await adminClient
      .from('customers')
      .select('*')
      .eq('id', input.customerId)
      .single();

    if (!customer) {
      return { success: false, error: 'Cliente no encontrado' };
    }

    // Get debt case and invoice info if provided
    let debtCase: {
      id: string;
      total_debt: string;
      currency: string;
      invoice?: {
        id: string;
        number: string;
        total: string;
        subtotal: string;
        issue_date: string;
        due_date: string;
        notes: string | null;
      };
    } | null = null;

    if (input.debtCaseId) {
      const { data } = await adminClient
        .from('debt_cases')
        .select('id, total_debt, currency, invoice_id')
        .eq('id', input.debtCaseId)
        .single();

      if (data?.invoice_id) {
        const { data: invoice } = await adminClient
          .from('invoices')
          .select('id, number, total, subtotal, issue_date, due_date, notes')
          .eq('id', data.invoice_id)
          .single();

        debtCase = {
          id: data.id,
          total_debt: data.total_debt,
          currency: data.currency,
          invoice: invoice ?? undefined,
        };
      } else if (data) {
        debtCase = {
          id: data.id,
          total_debt: data.total_debt,
          currency: data.currency,
        };
      }
    }

    // Create call record first
    const callData: TablesInsert<'voice_calls'> = {
      company_id: DEMO_COMPANY_ID,
      voice_agent_id: input.voiceAgentId,
      customer_id: input.customerId,
      debt_case_id: input.debtCaseId ?? null,
      phone_number: input.phoneNumber,
      status: 'pending',
      direction: 'outbound',
    };

    const { data: call, error: insertError } = await adminClient
      .from('voice_calls')
      .insert(callData)
      .select()
      .single();

    if (insertError) throw insertError;

    // Helper to format currency for Spanish locale
    const formatCurrency = (amount: number): string => {
      return amount.toLocaleString('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };

    // Helper to format date for Spanish locale
    const formatDate = (dateStr: string): string => {
      return new Date(dateStr).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    };

    // Extract invoice concept from notes
    const getInvoiceConcept = (): string => {
      if (!debtCase?.invoice) return 'Factura pendiente';
      return debtCase.invoice.notes ?? 'Factura pendiente';
    };

    const invoiceAmount = Number.parseFloat(debtCase?.invoice?.total ?? debtCase?.total_debt ?? '0');
    const halfAmount = invoiceAmount / 2;

    // Build dynamic variables for ElevenLabs agent
    // These match the variables defined in the ElevenLabs agent configuration
    const dynamicVariables: Record<string, string> = {
      // Company info
      company_name: company.name,
      company_tax_id: company.tax_id ?? '',
      company_email: company.email ?? '',
      company_phone: company.phone ?? '',

      // Customer/debtor info
      contact_name: customer.name,
      debtor_name: customer.name,

      // Invoice info
      invoice_number: debtCase?.invoice?.number ?? 'N/A',
      invoice_amount: formatCurrency(invoiceAmount),
      invoice_due_date: debtCase?.invoice?.due_date
        ? formatDate(debtCase.invoice.due_date)
        : 'N/A',
      invoice_issue_date: debtCase?.invoice?.issue_date
        ? formatDate(debtCase.invoice.issue_date)
        : 'N/A',
      invoice_concept: getInvoiceConcept(),

      // Calculated fields
      half_amount: formatCurrency(halfAmount),

      // Internal tracking
      call_id: call.id,
      customer_id: customer.id,
      debt_case_id: debtCase?.id ?? '',
    };

    // Initiate call via ElevenLabs with dynamic variables
    const elevenLabs = getElevenLabsClient();
    const callResponse = await elevenLabs.initiateCall({
      agentId: agent.elevenlabs_agent_id,
      phoneNumber: input.phoneNumber,
      firstMessage: input.customFirstMessage,
      customData: dynamicVariables,
    });

    // Update call with ElevenLabs info
    const { data: updatedCall, error: updateError } = await adminClient
      .from('voice_calls')
      .update({
        elevenlabs_call_id: callResponse.conversation_id,
        twilio_call_sid: callResponse.callSid,
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .eq('id', call.id)
      .select()
      .single();

    if (updateError) throw updateError;

    revalidatePath('/voice-calls');
    return { success: true, data: updatedCall };
  } catch (error) {
    console.error('Error initiating call:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Get call history
 */
export async function getCallHistory(filters?: {
  customerId?: string;
  debtCaseId?: string;
  status?: string;
  limit?: number;
}): Promise<ActionResult<VoiceCall[]>> {
  try {
    const adminClient = await createAdminClient();
    const DEMO_COMPANY_ID = '00000000-0000-0000-0000-000000000001';

    let query = adminClient
      .from('voice_calls')
      .select('*, customers(id, name, email, phone), debt_cases(id, total_debt, status)')
      .eq('company_id', DEMO_COMPANY_ID)
      .order('created_at', { ascending: false })
      .limit(filters?.limit ?? 50);

    if (filters?.customerId) {
      query = query.eq('customer_id', filters.customerId);
    }
    if (filters?.debtCaseId) {
      query = query.eq('debt_case_id', filters.debtCaseId);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status as VoiceCall['status']);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, data: data ?? [] };
  } catch (error) {
    console.error('Error getting call history:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Sync call status from ElevenLabs
 */
export async function syncCallStatus(
  callId: string
): Promise<ActionResult<VoiceCall>> {
  try {
    const supabase = await createClient();

    const { data: call } = await supabase
      .from('voice_calls')
      .select('*')
      .eq('id', callId)
      .single();

    if (!call?.elevenlabs_call_id) {
      return { success: false, error: 'Llamada no encontrada' };
    }

    const elevenLabs = getElevenLabsClient();
    const status = await elevenLabs.getCallStatus(call.elevenlabs_call_id);

    const updates: TablesUpdate<'voice_calls'> = {
      status: mapStatus(status.status),
      duration: status.duration,
      recording_url: status.recording_url,
      transcription: status.transcript,
      summary: status.analysis?.summary,
      sentiment: status.analysis?.sentiment,
      outcome: mapOutcome(status.analysis?.outcome),
      metadata: (status.analysis?.extracted_data ?? null) as Json | null,
      updated_at: new Date().toISOString(),
    };

    if (status.status === 'completed' || status.status === 'failed') {
      updates.ended_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('voice_calls')
      .update(updates)
      .eq('id', callId)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/calls');
    return { success: true, data };
  } catch (error) {
    console.error('Error syncing call status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function mapStatus(status: string): VoiceCall['status'] {
  const map: Record<string, VoiceCall['status']> = {
    pending: 'pending',
    in_progress: 'in_progress',
    ringing: 'in_progress',
    answered: 'in_progress',
    completed: 'completed',
    failed: 'failed',
    no_answer: 'no_answer',
    voicemail: 'voicemail',
    busy: 'busy',
    cancelled: 'cancelled',
  };
  return map[status] ?? 'pending';
}

function mapOutcome(outcome?: string): VoiceCall['outcome'] {
  if (!outcome) return null;
  const map: Record<string, VoiceCall['outcome']> = {
    promise_to_pay: 'promise_to_pay',
    payment_plan_agreed: 'payment_plan_agreed',
    dispute: 'dispute',
    callback_requested: 'callback_requested',
    wrong_number: 'wrong_number',
    not_interested: 'not_interested',
    escalate: 'escalate',
  };
  return map[outcome] ?? 'no_outcome';
}

// =============================================================================
// ELEVENLABS VOICES
// =============================================================================

/**
 * Get available voices from ElevenLabs
 */
export async function getElevenLabsVoices(): Promise<
  ActionResult<Array<{ voice_id: string; name: string; labels?: Record<string, string> }>>
> {
  try {
    const elevenLabs = getElevenLabsClient();
    const voices = await elevenLabs.getVoices();
    return { success: true, data: voices };
  } catch (error) {
    console.error('Error getting voices:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * List agents from ElevenLabs account (not from local DB)
 */
export async function listElevenLabsAgents(options?: {
  search?: string;
  pageSize?: number;
}): Promise<ActionResult<ElevenLabsAgentListItem[]>> {
  try {
    const elevenLabs = getElevenLabsClient();
    const response = await elevenLabs.listAgents({
      search: options?.search,
      pageSize: options?.pageSize ?? 30,
    });
    return { success: true, data: response.agents };
  } catch (error) {
    console.error('Error listing ElevenLabs agents:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Get customers for the call selector
 */
export async function getCustomersForCalls(): Promise<
  ActionResult<Array<{ id: string; name: string; phone: string | null }>>
> {
  try {
    const adminClient = await createAdminClient();
    const DEMO_COMPANY_ID = '00000000-0000-0000-0000-000000000001';

    const { data, error } = await adminClient
      .from('customers')
      .select('id, name, phone')
      .eq('company_id', DEMO_COMPANY_ID)
      .is('deleted_at', null)
      .order('name');

    if (error) throw error;

    return { success: true, data: data ?? [] };
  } catch (error) {
    console.error('Error getting customers:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Get debt cases for a customer (for the call selector)
 */
export interface DebtCaseForCall {
  id: string;
  total_debt: string;
  currency: string;
  invoice_number: string | null;
  invoice_total: string | null;
}

export async function getDebtCasesForCustomer(
  customerId: string
): Promise<ActionResult<DebtCaseForCall[]>> {
  try {
    const adminClient = await createAdminClient();
    const DEMO_COMPANY_ID = '00000000-0000-0000-0000-000000000001';

    const { data, error } = await adminClient
      .from('debt_cases')
      .select(`
        id,
        total_debt,
        currency,
        invoices!inner (
          number,
          total
        )
      `)
      .eq('company_id', DEMO_COMPANY_ID)
      .eq('customer_id', customerId)
      .in('status', ['pending', 'in_progress', 'payment_plan', 'escalated', 'legal'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform the data to flatten invoice info
    const debtCases: DebtCaseForCall[] = (data ?? []).map((dc) => {
      const invoice = dc.invoices as { number: string; total: string } | null;
      return {
        id: dc.id,
        total_debt: dc.total_debt,
        currency: dc.currency,
        invoice_number: invoice?.number ?? null,
        invoice_total: invoice?.total ?? null,
      };
    });

    return { success: true, data: debtCases };
  } catch (error) {
    console.error('Error getting debt cases:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Initiate a test call directly (without saving to DB)
 * For demo/testing purposes
 */
export async function initiateTestCall(input: {
  agentId: string;
  phoneNumber: string;
  firstMessage?: string;
}): Promise<ActionResult<{ conversationId: string | null; callSid: string | null }>> {
  try {
    const elevenLabs = getElevenLabsClient();

    const response = await elevenLabs.initiateCall({
      agentId: input.agentId,
      phoneNumber: input.phoneNumber,
      firstMessage: input.firstMessage,
    });

    return {
      success: response.success,
      data: {
        conversationId: response.conversation_id,
        callSid: response.callSid,
      },
      error: response.success ? undefined : response.message,
    };
  } catch (error) {
    console.error('Error initiating test call:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Sync a local voice agent with ElevenLabs
 * Creates the agent in ElevenLabs if it doesn't exist
 */
export async function syncAgentWithElevenLabs(
  agentId: string
): Promise<ActionResult<VoiceAgent>> {
  try {
    const supabase = await createClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'No autenticado' };
    }

    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.user.id)
      .single();

    if (!userData) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    // Get the agent
    const { data: agent, error: agentError } = await supabase
      .from('voice_agents')
      .select('*')
      .eq('id', agentId)
      .eq('company_id', userData.company_id)
      .single();

    if (agentError || !agent) {
      return { success: false, error: 'Agente no encontrado' };
    }

    // If already has elevenlabs_agent_id, return as is
    if (agent.elevenlabs_agent_id) {
      return { success: true, data: agent };
    }

    // Create in ElevenLabs
    const elevenLabs = getElevenLabsClient();
    const elevenLabsAgentId = await elevenLabs.createAgent({
      name: agent.name,
      voiceId: agent.voice_id,
      language: agent.language,
      systemPrompt: agent.system_prompt,
      firstMessage: agent.first_message,
      settings: agent.settings as unknown as VoiceAgentSettings | undefined,
    });

    // Update local record
    const { data: updatedAgent, error: updateError } = await supabase
      .from('voice_agents')
      .update({
        elevenlabs_agent_id: elevenLabsAgentId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', agentId)
      .select()
      .single();

    if (updateError) throw updateError;

    revalidatePath('/voice-calls');
    return { success: true, data: updatedAgent };
  } catch (error) {
    console.error('Error syncing agent with ElevenLabs:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Link an existing ElevenLabs agent to a local voice agent
 */
export async function linkElevenLabsAgent(
  localAgentId: string,
  elevenLabsAgentId: string
): Promise<ActionResult<VoiceAgent>> {
  try {
    const adminClient = await createAdminClient();

    // For demo: use demo company ID
    const DEMO_COMPANY_ID = '00000000-0000-0000-0000-000000000001';

    // Verify the ElevenLabs agent exists
    const elevenLabs = getElevenLabsClient();
    try {
      await elevenLabs.getAgent(elevenLabsAgentId);
    } catch {
      return { success: false, error: 'Agente de ElevenLabs no encontrado' };
    }

    // Update local record using admin client
    const { data: updatedAgent, error: updateError } = await adminClient
      .from('voice_agents')
      .update({
        elevenlabs_agent_id: elevenLabsAgentId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', localAgentId)
      .eq('company_id', DEMO_COMPANY_ID)
      .select()
      .single();

    if (updateError) throw updateError;
    if (!updatedAgent) {
      return { success: false, error: 'Agente no encontrado' };
    }

    revalidatePath('/voice-calls');
    return { success: true, data: updatedAgent };
  } catch (error) {
    console.error('Error linking ElevenLabs agent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}
