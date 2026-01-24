/**
 * Voice Agent Service
 *
 * Manages voice agents in the database and coordinates with ElevenLabs.
 */

import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../db';
import {
  voiceAgents,
  voiceCalls,
  debtCases,
  customers,
  invoices,
  debtCaseActivities,
  type NewVoiceAgentRow,
  type NewVoiceCallRow,
  type VoiceAgentRow,
  type VoiceCallRow,
} from '../../db/schema';
import {
  ElevenLabsService,
  getElevenLabsService,
  type CreateAgentParams,
  type OutboundCallResponse,
  type CallStatusResponse,
} from './elevenlabs.service';

// =============================================================================
// TYPES
// =============================================================================

interface CreateVoiceAgentInput {
  companyId: string;
  name: string;
  voiceId: string;
  language?: string;
  systemPrompt: string;
  firstMessage: string;
  settings?: {
    maxCallDuration?: number;
    temperature?: number;
    stability?: number;
    similarityBoost?: number;
    enableTranscription?: boolean;
    enableRecording?: boolean;
  };
}

interface InitiateCallInput {
  companyId: string;
  voiceAgentId: string;
  customerId: string;
  debtCaseId?: string;
  campaignId?: string;
  phoneNumber: string;
  scheduledAt?: Date;
  customFirstMessage?: string;
}

interface CallWithDetails extends VoiceCallRow {
  customer?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  debtCase?: {
    id: string;
    totalDebt: string;
    status: string;
  } | null;
}

// =============================================================================
// SERVICE
// =============================================================================

export class VoiceAgentService {
  private elevenLabs: ElevenLabsService;

  constructor(elevenLabsService?: ElevenLabsService) {
    this.elevenLabs = elevenLabsService ?? getElevenLabsService();
  }

  // ---------------------------------------------------------------------------
  // VOICE AGENT CRUD
  // ---------------------------------------------------------------------------

  /**
   * Create a new voice agent
   */
  async createVoiceAgent(input: CreateVoiceAgentInput): Promise<VoiceAgentRow> {
    // Create the agent in ElevenLabs first
    const elevenLabsAgentId = await this.elevenLabs.createAgent({
      name: input.name,
      voiceId: input.voiceId,
      language: input.language ?? 'es',
      systemPrompt: input.systemPrompt,
      firstMessage: input.firstMessage,
      settings: input.settings,
    });

    // Store in database
    const agentData: NewVoiceAgentRow = {
      companyId: input.companyId,
      name: input.name,
      elevenLabsAgentId,
      voiceId: input.voiceId,
      language: input.language ?? 'es',
      systemPrompt: input.systemPrompt,
      firstMessage: input.firstMessage,
      settings: {
        maxCallDuration: input.settings?.maxCallDuration ?? 300,
        temperature: input.settings?.temperature ?? 0.5,
        stability: input.settings?.stability ?? 0.5,
        similarityBoost: input.settings?.similarityBoost ?? 0.75,
        enableTranscription: input.settings?.enableTranscription ?? true,
        enableRecording: input.settings?.enableRecording ?? true,
      },
      isActive: true,
    };

    const [agent] = await db.insert(voiceAgents).values(agentData).returning();

    return agent;
  }

  /**
   * Get all voice agents for a company
   */
  async getVoiceAgents(companyId: string): Promise<VoiceAgentRow[]> {
    return db.query.voiceAgents.findMany({
      where: and(
        eq(voiceAgents.companyId, companyId),
        isNull(voiceAgents.deletedAt)
      ),
      orderBy: (voiceAgents, { desc }) => [desc(voiceAgents.createdAt)],
    });
  }

  /**
   * Get a single voice agent by ID
   */
  async getVoiceAgent(
    agentId: string,
    companyId: string
  ): Promise<VoiceAgentRow | null> {
    const agent = await db.query.voiceAgents.findFirst({
      where: and(
        eq(voiceAgents.id, agentId),
        eq(voiceAgents.companyId, companyId),
        isNull(voiceAgents.deletedAt)
      ),
    });

    return agent ?? null;
  }

  /**
   * Update a voice agent
   */
  async updateVoiceAgent(
    agentId: string,
    companyId: string,
    updates: Partial<CreateVoiceAgentInput>
  ): Promise<VoiceAgentRow | null> {
    const agent = await this.getVoiceAgent(agentId, companyId);
    if (!agent) return null;

    // Update in ElevenLabs if needed
    if (
      agent.elevenLabsAgentId &&
      (updates.name || updates.systemPrompt || updates.firstMessage)
    ) {
      await this.elevenLabs.updateAgent(agent.elevenLabsAgentId, {
        name: updates.name,
        systemPrompt: updates.systemPrompt,
        firstMessage: updates.firstMessage,
        language: updates.language,
      });
    }

    // Update in database
    const [updated] = await db
      .update(voiceAgents)
      .set({
        ...(updates.name && { name: updates.name }),
        ...(updates.voiceId && { voiceId: updates.voiceId }),
        ...(updates.language && { language: updates.language }),
        ...(updates.systemPrompt && { systemPrompt: updates.systemPrompt }),
        ...(updates.firstMessage && { firstMessage: updates.firstMessage }),
        ...(updates.settings && { settings: { ...agent.settings, ...updates.settings } }),
        updatedAt: new Date(),
      })
      .where(eq(voiceAgents.id, agentId))
      .returning();

    return updated;
  }

  /**
   * Soft delete a voice agent
   */
  async deleteVoiceAgent(agentId: string, companyId: string): Promise<boolean> {
    const agent = await this.getVoiceAgent(agentId, companyId);
    if (!agent) return false;

    // Delete from ElevenLabs
    if (agent.elevenLabsAgentId) {
      try {
        await this.elevenLabs.deleteAgent(agent.elevenLabsAgentId);
      } catch (error) {
        console.error('Failed to delete agent from ElevenLabs:', error);
      }
    }

    // Soft delete in database
    await db
      .update(voiceAgents)
      .set({
        deletedAt: new Date(),
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(voiceAgents.id, agentId));

    return true;
  }

  // ---------------------------------------------------------------------------
  // VOICE CALLS
  // ---------------------------------------------------------------------------

  /**
   * Initiate an outbound call
   */
  async initiateCall(input: InitiateCallInput): Promise<VoiceCallRow> {
    const agent = await this.getVoiceAgent(input.voiceAgentId, input.companyId);
    if (!agent || !agent.elevenLabsAgentId) {
      throw new Error('Voice agent not found or not configured');
    }

    // Get customer info for personalization
    const customer = await db.query.customers.findFirst({
      where: eq(customers.id, input.customerId),
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Get debt case info if provided
    let debtCase = null;
    if (input.debtCaseId) {
      debtCase = await db.query.debtCases.findFirst({
        where: eq(debtCases.id, input.debtCaseId),
        with: {
          invoice: true,
        },
      });
    }

    // Create call record first (pending status)
    const callData: NewVoiceCallRow = {
      companyId: input.companyId,
      voiceAgentId: input.voiceAgentId,
      customerId: input.customerId,
      debtCaseId: input.debtCaseId,
      campaignId: input.campaignId,
      phoneNumber: input.phoneNumber,
      status: input.scheduledAt ? 'pending' : 'in_progress',
      direction: 'outbound',
      scheduledAt: input.scheduledAt,
    };

    const [call] = await db.insert(voiceCalls).values(callData).returning();

    // If scheduled for later, don't initiate the call now
    if (input.scheduledAt && input.scheduledAt > new Date()) {
      return call;
    }

    // Generate personalized first message
    const firstMessage =
      input.customFirstMessage ??
      this.elevenLabs.generatePersonalizedFirstMessage(
        customer.name,
        'PayCore', // TODO: Get from company settings
        debtCase ? Number.parseFloat(debtCase.totalDebt) : 0,
        debtCase?.currency ?? 'EUR',
        agent.language
      );

    try {
      // Initiate the call via ElevenLabs
      const callResponse = await this.elevenLabs.initiateCall({
        agentId: agent.elevenLabsAgentId,
        phoneNumber: input.phoneNumber,
        firstMessage,
        customData: {
          callId: call.id,
          customerId: customer.id,
          customerName: customer.name,
          debtCaseId: debtCase?.id,
          debtAmount: debtCase?.totalDebt,
        },
      });

      // Update call record with ElevenLabs/Twilio IDs
      const [updatedCall] = await db
        .update(voiceCalls)
        .set({
          elevenLabsCallId: callResponse.conversation_id,
          twilioCallSid: callResponse.callSid,
          status: 'in_progress',
          startedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(voiceCalls.id, call.id))
        .returning();

      // Log activity if debt case exists
      if (input.debtCaseId) {
        await this.logCallActivity(
          input.debtCaseId,
          call.id,
          'call_initiated',
          `Outbound call initiated to ${input.phoneNumber}`
        );
      }

      return updatedCall;
    } catch (error) {
      // Mark call as failed
      await db
        .update(voiceCalls)
        .set({
          status: 'failed',
          updatedAt: new Date(),
        })
        .where(eq(voiceCalls.id, call.id));

      throw error;
    }
  }

  /**
   * Update call status from webhook
   */
  async updateCallStatus(
    callId: string,
    status: CallStatusResponse
  ): Promise<VoiceCallRow | null> {
    const call = await db.query.voiceCalls.findFirst({
      where: eq(voiceCalls.elevenLabsCallId, callId),
    });

    if (!call) return null;

    const updates: Partial<NewVoiceCallRow> = {
      status: this.mapElevenLabsStatus(status.status),
      duration: status.duration,
      recordingUrl: status.recording_url,
      transcription: status.transcript,
      summary: status.analysis?.summary,
      sentiment: status.analysis?.sentiment,
      outcome: this.mapOutcome(status.analysis?.outcome),
      metadata: status.analysis?.extracted_data as VoiceCallRow['metadata'],
      updatedAt: new Date(),
    };

    if (status.status === 'completed' || status.status === 'failed') {
      updates.endedAt = new Date();
    }

    const [updatedCall] = await db
      .update(voiceCalls)
      .set(updates)
      .where(eq(voiceCalls.id, call.id))
      .returning();

    // Log activity if debt case exists
    if (call.debtCaseId) {
      await this.logCallActivity(
        call.debtCaseId,
        call.id,
        'call_completed',
        `Call ${status.status}. Duration: ${status.duration}s. Outcome: ${status.analysis?.outcome ?? 'unknown'}`
      );

      // Update debt case status based on outcome
      if (status.analysis?.outcome) {
        await this.updateDebtCaseFromCallOutcome(
          call.debtCaseId,
          status.analysis.outcome,
          status.analysis.extracted_data
        );
      }
    }

    return updatedCall;
  }

  /**
   * Get call history for a company
   */
  async getCallHistory(
    companyId: string,
    filters?: {
      customerId?: string;
      debtCaseId?: string;
      campaignId?: string;
      status?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<CallWithDetails[]> {
    const conditions = [eq(voiceCalls.companyId, companyId)];

    if (filters?.customerId) {
      conditions.push(eq(voiceCalls.customerId, filters.customerId));
    }
    if (filters?.debtCaseId) {
      conditions.push(eq(voiceCalls.debtCaseId, filters.debtCaseId));
    }
    if (filters?.campaignId) {
      conditions.push(eq(voiceCalls.campaignId, filters.campaignId));
    }
    if (filters?.status) {
      conditions.push(
        eq(voiceCalls.status, filters.status as VoiceCallRow['status'])
      );
    }

    const calls = await db.query.voiceCalls.findMany({
      where: and(...conditions),
      with: {
        customer: {
          columns: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        debtCase: {
          columns: {
            id: true,
            totalDebt: true,
            status: true,
          },
        },
      },
      orderBy: (voiceCalls, { desc }) => [desc(voiceCalls.createdAt)],
      limit: filters?.limit ?? 50,
      offset: filters?.offset ?? 0,
    });

    return calls as CallWithDetails[];
  }

  /**
   * Get call details by ID
   */
  async getCallDetails(
    callId: string,
    companyId: string
  ): Promise<CallWithDetails | null> {
    const call = await db.query.voiceCalls.findFirst({
      where: and(
        eq(voiceCalls.id, callId),
        eq(voiceCalls.companyId, companyId)
      ),
      with: {
        customer: {
          columns: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        debtCase: {
          columns: {
            id: true,
            totalDebt: true,
            status: true,
          },
        },
        voiceAgent: true,
      },
    });

    return (call as CallWithDetails) ?? null;
  }

  /**
   * Sync call status from ElevenLabs
   */
  async syncCallStatus(callId: string): Promise<VoiceCallRow | null> {
    const call = await db.query.voiceCalls.findFirst({
      where: eq(voiceCalls.id, callId),
    });

    if (!call?.elevenLabsCallId) return null;

    const status = await this.elevenLabs.getCallStatus(call.elevenLabsCallId);
    return this.updateCallStatus(call.elevenLabsCallId, status);
  }

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  private mapElevenLabsStatus(
    status: string
  ): VoiceCallRow['status'] {
    const statusMap: Record<string, VoiceCallRow['status']> = {
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

    return statusMap[status] ?? 'pending';
  }

  private mapOutcome(
    outcome?: string
  ): VoiceCallRow['outcome'] | undefined {
    if (!outcome) return undefined;

    const outcomeMap: Record<string, VoiceCallRow['outcome']> = {
      promise_to_pay: 'promise_to_pay',
      payment_plan_agreed: 'payment_plan_agreed',
      dispute: 'dispute',
      callback_requested: 'callback_requested',
      wrong_number: 'wrong_number',
      not_interested: 'not_interested',
      escalate: 'escalate',
    };

    return outcomeMap[outcome] ?? 'no_outcome';
  }

  private async logCallActivity(
    debtCaseId: string,
    callId: string,
    action: string,
    notes: string
  ): Promise<void> {
    // Get a system user ID or use a placeholder
    // In production, this should be the actual user who initiated the call
    const systemUserId = '00000000-0000-0000-0000-000000000000';

    await db.insert(debtCaseActivities).values({
      debtCaseId,
      userId: systemUserId,
      action,
      notes,
      contactMethod: 'voice',
      outcome: 'call_recorded',
    });
  }

  private async updateDebtCaseFromCallOutcome(
    debtCaseId: string,
    outcome: string,
    extractedData?: Record<string, unknown>
  ): Promise<void> {
    const updates: Record<string, unknown> = {
      lastContactAt: new Date(),
      updatedAt: new Date(),
    };

    switch (outcome) {
      case 'promise_to_pay':
        updates.status = 'contacted';
        if (extractedData?.promisedDate) {
          updates.nextActionAt = new Date(extractedData.promisedDate as string);
          updates.nextAction = `Follow up on payment promise`;
        }
        break;

      case 'payment_plan_agreed':
        updates.status = 'payment_plan';
        break;

      case 'dispute':
        updates.status = 'escalated';
        updates.nextAction = 'Review dispute and respond';
        break;

      case 'callback_requested':
        if (extractedData?.callbackDate) {
          updates.nextActionAt = new Date(extractedData.callbackDate as string);
          updates.nextAction = 'Scheduled callback';
        }
        break;

      case 'escalate':
        updates.status = 'escalated';
        updates.priority = 'high';
        break;

      default:
        // No status change for other outcomes
        break;
    }

    await db
      .update(debtCases)
      .set(updates)
      .where(eq(debtCases.id, debtCaseId));
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

let voiceAgentServiceInstance: VoiceAgentService | null = null;

export function getVoiceAgentService(): VoiceAgentService {
  if (!voiceAgentServiceInstance) {
    voiceAgentServiceInstance = new VoiceAgentService();
  }
  return voiceAgentServiceInstance;
}
