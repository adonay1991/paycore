'use server';

/**
 * Collection Campaigns Server Actions
 *
 * Server actions for managing automated collection campaigns.
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type {
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
  CampaignFilters,
  CampaignSchedule,
  CampaignStats,
} from '@/lib/supabase/types';

// =============================================================================
// TYPES
// =============================================================================

export type Campaign = Tables<'collection_campaigns'>;

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CreateCampaignInput {
  name: string;
  description?: string;
  type: Campaign['type'];
  voiceAgentId?: string;
  templateId?: string;
  filters?: CampaignFilters;
  schedule?: CampaignSchedule;
  scheduledAt?: string;
}

// =============================================================================
// CAMPAIGNS CRUD
// =============================================================================

/**
 * Get all campaigns for the current company
 */
export async function getCampaigns(): Promise<ActionResult<Campaign[]>> {
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
      .from('collection_campaigns')
      .select('*, voice_agents(id, name), communication_templates(id, name)')
      .eq('company_id', userData.company_id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: data ?? [] };
  } catch (error) {
    console.error('Error getting campaigns:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Get a single campaign by ID
 */
export async function getCampaign(
  campaignId: string
): Promise<ActionResult<Campaign & { contacts?: unknown[] }>> {
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
      .from('collection_campaigns')
      .select(`
        *,
        voice_agents(id, name),
        communication_templates(id, name, type),
        campaign_contacts(
          id,
          status,
          attempts,
          outcome,
          customers(id, name, email, phone),
          debt_cases(id, total_debt, status)
        )
      `)
      .eq('id', campaignId)
      .eq('company_id', userData.company_id)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    if (!data) {
      return { success: false, error: 'Campaña no encontrada' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error getting campaign:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Create a new campaign
 */
export async function createCampaign(
  input: CreateCampaignInput
): Promise<ActionResult<Campaign>> {
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

    const defaultSchedule: CampaignSchedule = {
      startTime: '09:00',
      endTime: '18:00',
      timezone: 'Europe/Madrid',
      daysOfWeek: [1, 2, 3, 4, 5],
    };

    const campaignData: TablesInsert<'collection_campaigns'> = {
      company_id: userData.company_id,
      name: input.name,
      description: input.description ?? null,
      type: input.type,
      status: 'draft',
      voice_agent_id: input.voiceAgentId ?? null,
      template_id: input.templateId ?? null,
      filters: (input.filters ?? {}) as unknown as Json,
      schedule: (input.schedule ?? defaultSchedule) as unknown as Json,
      scheduled_at: input.scheduledAt ?? null,
    };

    const { data, error } = await supabase
      .from('collection_campaigns')
      .insert(campaignData)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/campaigns');
    return { success: true, data };
  } catch (error) {
    console.error('Error creating campaign:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Update a campaign
 */
export async function updateCampaign(
  campaignId: string,
  updates: Partial<CreateCampaignInput>
): Promise<ActionResult<Campaign>> {
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

    const updateData: TablesUpdate<'collection_campaigns'> = {
      ...(updates.name && { name: updates.name }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.type && { type: updates.type }),
      ...(updates.voiceAgentId !== undefined && { voice_agent_id: updates.voiceAgentId }),
      ...(updates.templateId !== undefined && { template_id: updates.templateId }),
      ...(updates.filters && { filters: updates.filters as unknown as Json }),
      ...(updates.schedule && { schedule: updates.schedule as unknown as Json }),
      ...(updates.scheduledAt !== undefined && { scheduled_at: updates.scheduledAt }),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('collection_campaigns')
      .update(updateData)
      .eq('id', campaignId)
      .eq('company_id', userData.company_id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/campaigns');
    revalidatePath(`/campaigns/${campaignId}`);
    return { success: true, data };
  } catch (error) {
    console.error('Error updating campaign:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Delete a campaign (soft delete)
 */
export async function deleteCampaign(
  campaignId: string
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

    const { error } = await supabase
      .from('collection_campaigns')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', campaignId)
      .eq('company_id', userData.company_id);

    if (error) throw error;

    revalidatePath('/campaigns');
    return { success: true };
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// =============================================================================
// CAMPAIGN CONTACTS
// =============================================================================

/**
 * Add debt cases to a campaign based on filters
 */
export async function populateCampaignContacts(
  campaignId: string
): Promise<ActionResult<{ added: number }>> {
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

    // Get campaign with filters
    const { data: campaign } = await supabase
      .from('collection_campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('company_id', userData.company_id)
      .single();

    if (!campaign) {
      return { success: false, error: 'Campaña no encontrada' };
    }

    // Cast filters and stats to proper types
    const filters = (campaign.filters ?? {}) as unknown as CampaignFilters;
    const currentStats = (campaign.stats ?? {}) as unknown as CampaignStats;

    // Build query based on filters
    let query = supabase
      .from('debt_cases')
      .select('id, customer_id, total_debt, status, priority, invoices(due_date)')
      .eq('company_id', userData.company_id)
      .is('deleted_at', null);

    if (filters.minDebtAmount) {
      query = query.gte('total_debt', filters.minDebtAmount);
    }
    if (filters.maxDebtAmount) {
      query = query.lte('total_debt', filters.maxDebtAmount);
    }
    if (filters.priorities?.length) {
      query = query.in('priority', filters.priorities as Tables<'debt_cases'>['priority'][]);
    }
    if (filters.statuses?.length) {
      query = query.in('status', filters.statuses as Tables<'debt_cases'>['status'][]);
    }

    const { data: debtCases, error: queryError } = await query;

    if (queryError) throw queryError;

    if (!debtCases?.length) {
      return { success: true, data: { added: 0 } };
    }

    // Filter by days overdue if needed
    let filteredCases = debtCases;
    if (filters.daysOverdueMin || filters.daysOverdueMax) {
      const now = new Date();
      filteredCases = debtCases.filter((dc) => {
        const invoice = dc.invoices as unknown as { due_date: string } | null;
        if (!invoice?.due_date) return false;

        const dueDate = new Date(invoice.due_date);
        const daysOverdue = Math.floor(
          (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (filters.daysOverdueMin && daysOverdue < filters.daysOverdueMin) {
          return false;
        }
        if (filters.daysOverdueMax && daysOverdue > filters.daysOverdueMax) {
          return false;
        }
        return true;
      });
    }

    // Get existing contacts to avoid duplicates
    const { data: existingContacts } = await supabase
      .from('campaign_contacts')
      .select('debt_case_id')
      .eq('campaign_id', campaignId);

    const existingDebtCaseIds = new Set(
      existingContacts?.map((c) => c.debt_case_id) ?? []
    );

    // Create new contacts
    const newContacts = filteredCases
      .filter((dc) => !existingDebtCaseIds.has(dc.id))
      .map((dc) => ({
        campaign_id: campaignId,
        debt_case_id: dc.id,
        customer_id: dc.customer_id,
        status: 'pending',
        attempts: 0,
        max_attempts: 3,
      }));

    if (newContacts.length === 0) {
      return { success: true, data: { added: 0 } };
    }

    const { error: insertError } = await supabase
      .from('campaign_contacts')
      .insert(newContacts);

    if (insertError) throw insertError;

    // Update campaign stats
    const updatedStats: CampaignStats = {
      totalContacts: (currentStats.totalContacts ?? 0) + newContacts.length,
      contacted: currentStats.contacted ?? 0,
      successful: currentStats.successful ?? 0,
      failed: currentStats.failed ?? 0,
      pending: (currentStats.pending ?? 0) + newContacts.length,
    };

    await supabase
      .from('collection_campaigns')
      .update({ stats: updatedStats as unknown as Json })
      .eq('id', campaignId);

    revalidatePath(`/campaigns/${campaignId}`);
    return { success: true, data: { added: newContacts.length } };
  } catch (error) {
    console.error('Error populating campaign contacts:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// =============================================================================
// CAMPAIGN LIFECYCLE
// =============================================================================

/**
 * Start a campaign
 */
export async function startCampaign(
  campaignId: string
): Promise<ActionResult<Campaign>> {
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
      .from('collection_campaigns')
      .update({
        status: 'running',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId)
      .eq('company_id', userData.company_id)
      .in('status', ['draft', 'scheduled', 'paused'])
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/campaigns');
    revalidatePath(`/campaigns/${campaignId}`);
    return { success: true, data };
  } catch (error) {
    console.error('Error starting campaign:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Pause a campaign
 */
export async function pauseCampaign(
  campaignId: string
): Promise<ActionResult<Campaign>> {
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
      .from('collection_campaigns')
      .update({
        status: 'paused',
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId)
      .eq('company_id', userData.company_id)
      .eq('status', 'running')
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/campaigns');
    revalidatePath(`/campaigns/${campaignId}`);
    return { success: true, data };
  } catch (error) {
    console.error('Error pausing campaign:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Complete a campaign
 */
export async function completeCampaign(
  campaignId: string
): Promise<ActionResult<Campaign>> {
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
      .from('collection_campaigns')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId)
      .eq('company_id', userData.company_id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/campaigns');
    revalidatePath(`/campaigns/${campaignId}`);
    return { success: true, data };
  } catch (error) {
    console.error('Error completing campaign:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Cancel a campaign
 */
export async function cancelCampaign(
  campaignId: string
): Promise<ActionResult<Campaign>> {
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
      .from('collection_campaigns')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId)
      .eq('company_id', userData.company_id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/campaigns');
    revalidatePath(`/campaigns/${campaignId}`);
    return { success: true, data };
  } catch (error) {
    console.error('Error cancelling campaign:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}
