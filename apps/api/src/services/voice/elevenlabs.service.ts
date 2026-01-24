/**
 * ElevenLabs Voice Agent Service
 *
 * Integrates with ElevenLabs Conversational AI API for automated
 * debt collection voice calls.
 */

import type {
  NewVoiceAgentRow,
  NewVoiceCallRow,
  VoiceAgentRow,
  VoiceCallRow,
} from '../../db/schema';

// =============================================================================
// TYPES
// =============================================================================

interface ElevenLabsConfig {
  apiKey: string;
  baseUrl: string;
  phoneNumberId: string | null;
}

interface CreateAgentParams {
  name: string;
  voiceId: string;
  language: string;
  systemPrompt: string;
  firstMessage: string;
  settings?: {
    maxCallDuration?: number;
    temperature?: number;
    stability?: number;
    similarityBoost?: number;
  };
}

interface ElevenLabsAgentResponse {
  agent_id: string;
  name: string;
  conversation_config: {
    agent: {
      prompt: {
        prompt: string;
      };
      first_message: string;
      language: string;
    };
    tts: {
      voice_id: string;
    };
  };
}

interface OutboundCallParams {
  agentId: string;
  phoneNumber: string;
  phoneNumberId?: string;
  customData?: Record<string, unknown>;
  firstMessage?: string;
}

interface OutboundCallResponse {
  success: boolean;
  message: string;
  conversation_id: string | null;
  callSid: string | null;
}

interface ElevenLabsAgentListItem {
  agent_id: string;
  name: string;
  created_at_unix_secs: number;
  access_level: string;
  metadata?: {
    tags?: string[];
  };
}

interface ListAgentsResponse {
  agents: ElevenLabsAgentListItem[];
  cursor?: string;
  has_more: boolean;
}

interface BatchCallParams {
  agentId: string;
  contacts: Array<{
    phoneNumber: string;
    name?: string;
    customData?: Record<string, unknown>;
  }>;
  scheduledTime?: Date;
}

interface BatchCallResponse {
  batch_id: string;
  total_contacts: number;
  status: string;
}

interface CallStatusResponse {
  call_id: string;
  status: string;
  duration?: number;
  recording_url?: string;
  transcript?: string;
  analysis?: {
    summary?: string;
    sentiment?: string;
    outcome?: string;
    extracted_data?: Record<string, unknown>;
  };
}

interface VoiceInfo {
  voice_id: string;
  name: string;
  preview_url?: string;
  labels?: Record<string, string>;
}

// =============================================================================
// SERVICE
// =============================================================================

export class ElevenLabsService {
  private config: ElevenLabsConfig;

  constructor(apiKey?: string, phoneNumberId?: string) {
    const key = apiKey ?? process.env.ELEVENLABS_API_KEY;
    if (!key) {
      throw new Error('ELEVENLABS_API_KEY is required');
    }

    this.config = {
      apiKey: key,
      baseUrl: 'https://api.elevenlabs.io/v1',
      phoneNumberId: phoneNumberId ?? process.env.ELEVENLABS_PHONE_NUMBER_ID ?? null,
    };
  }

  // ---------------------------------------------------------------------------
  // PRIVATE HELPERS
  // ---------------------------------------------------------------------------

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'xi-api-key': this.config.apiKey,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `ElevenLabs API error (${response.status}): ${errorText}`
      );
    }

    return response.json() as Promise<T>;
  }

  // ---------------------------------------------------------------------------
  // VOICE MANAGEMENT
  // ---------------------------------------------------------------------------

  /**
   * Get available voices from ElevenLabs
   */
  async getVoices(): Promise<VoiceInfo[]> {
    const response = await this.request<{ voices: VoiceInfo[] }>('/voices');
    return response.voices;
  }

  /**
   * Get Spanish-speaking voices suitable for debt collection
   */
  async getSpanishVoices(): Promise<VoiceInfo[]> {
    const voices = await this.getVoices();
    return voices.filter(
      (voice) =>
        voice.labels?.language === 'es' ||
        voice.labels?.accent === 'spanish' ||
        voice.name.toLowerCase().includes('spanish')
    );
  }

  // ---------------------------------------------------------------------------
  // AGENT MANAGEMENT
  // ---------------------------------------------------------------------------

  /**
   * List all agents from ElevenLabs account
   * This returns agents created directly in the ElevenLabs dashboard
   */
  async listAgents(options?: {
    pageSize?: number;
    search?: string;
    cursor?: string;
  }): Promise<ListAgentsResponse> {
    const params = new URLSearchParams();
    if (options?.pageSize) params.append('page_size', String(options.pageSize));
    if (options?.search) params.append('search', options.search);
    if (options?.cursor) params.append('cursor', options.cursor);

    const queryString = params.toString();
    const endpoint = `/convai/agents${queryString ? `?${queryString}` : ''}`;

    return this.request<ListAgentsResponse>(endpoint);
  }

  /**
   * Create a new conversational AI agent
   */
  async createAgent(params: CreateAgentParams): Promise<string> {
    const payload = {
      conversation_config: {
        agent: {
          prompt: {
            prompt: params.systemPrompt,
          },
          first_message: params.firstMessage,
          language: params.language,
        },
        tts: {
          voice_id: params.voiceId,
          model_id: 'eleven_multilingual_v2',
          stability: params.settings?.stability ?? 0.5,
          similarity_boost: params.settings?.similarityBoost ?? 0.75,
        },
        conversation: {
          max_duration_seconds: params.settings?.maxCallDuration ?? 300,
        },
      },
      name: params.name,
      platform_settings: {
        twilio: {
          enable_call_recording: true,
        },
      },
    };

    const response = await this.request<ElevenLabsAgentResponse>(
      '/convai/agents/create',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );

    return response.agent_id;
  }

  /**
   * Update an existing agent
   */
  async updateAgent(
    agentId: string,
    params: Partial<CreateAgentParams>
  ): Promise<void> {
    const payload: Record<string, unknown> = {};

    if (params.name) {
      payload.name = params.name;
    }

    if (params.systemPrompt || params.firstMessage || params.language) {
      payload.conversation_config = {
        agent: {
          ...(params.systemPrompt && {
            prompt: { prompt: params.systemPrompt },
          }),
          ...(params.firstMessage && { first_message: params.firstMessage }),
          ...(params.language && { language: params.language }),
        },
      };
    }

    await this.request(`/convai/agents/${agentId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Delete an agent
   */
  async deleteAgent(agentId: string): Promise<void> {
    await this.request(`/convai/agents/${agentId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get agent details
   */
  async getAgent(agentId: string): Promise<ElevenLabsAgentResponse> {
    return this.request<ElevenLabsAgentResponse>(`/convai/agents/${agentId}`);
  }

  // ---------------------------------------------------------------------------
  // OUTBOUND CALLS
  // ---------------------------------------------------------------------------

  /**
   * Initiate an outbound call using Twilio integration
   */
  async initiateCall(params: OutboundCallParams): Promise<OutboundCallResponse> {
    const phoneNumberId = params.phoneNumberId ?? this.config.phoneNumberId;

    if (!phoneNumberId) {
      throw new Error(
        'Phone number ID is required. Set ELEVENLABS_PHONE_NUMBER_ID in your environment or pass phoneNumberId parameter.'
      );
    }

    const payload: Record<string, unknown> = {
      agent_id: params.agentId,
      agent_phone_number_id: phoneNumberId,
      to_number: params.phoneNumber,
    };

    // Add conversation initiation data if provided
    if (params.customData || params.firstMessage) {
      payload.conversation_initiation_client_data = {
        ...(params.customData && { dynamic_variables: params.customData }),
        ...(params.firstMessage && {
          conversation_config_override: {
            agent: {
              first_message: params.firstMessage,
            },
          },
        }),
      };
    }

    return this.request<OutboundCallResponse>('/convai/twilio/outbound-call', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Submit a batch of calls for processing
   */
  async submitBatchCalls(params: BatchCallParams): Promise<BatchCallResponse> {
    const contacts = params.contacts.map((contact) => ({
      phone_number: contact.phoneNumber,
      name: contact.name,
      custom_data: contact.customData,
    }));

    const payload = {
      agent_id: params.agentId,
      contacts,
      ...(params.scheduledTime && {
        scheduled_time: params.scheduledTime.toISOString(),
      }),
    };

    return this.request<BatchCallResponse>('/convai/batch-calling/submit', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Get the status of a specific call
   */
  async getCallStatus(callId: string): Promise<CallStatusResponse> {
    return this.request<CallStatusResponse>(`/convai/calls/${callId}`);
  }

  /**
   * Get call recording URL
   */
  async getCallRecording(callId: string): Promise<string | null> {
    const status = await this.getCallStatus(callId);
    return status.recording_url ?? null;
  }

  /**
   * Get call transcript
   */
  async getCallTranscript(callId: string): Promise<string | null> {
    const status = await this.getCallStatus(callId);
    return status.transcript ?? null;
  }

  // ---------------------------------------------------------------------------
  // DEBT COLLECTION SPECIFIC METHODS
  // ---------------------------------------------------------------------------

  /**
   * Create a debt collection agent with predefined prompts
   */
  async createDebtCollectionAgent(
    companyName: string,
    voiceId: string,
    language = 'es'
  ): Promise<string> {
    const systemPrompt = this.getDebtCollectionPrompt(companyName, language);
    const firstMessage = this.getDebtCollectionFirstMessage(
      companyName,
      language
    );

    return this.createAgent({
      name: `${companyName} - Debt Collection Agent`,
      voiceId,
      language,
      systemPrompt,
      firstMessage,
      settings: {
        maxCallDuration: 300,
        temperature: 0.5,
        stability: 0.7,
        similarityBoost: 0.75,
      },
    });
  }

  /**
   * Generate a personalized first message for a specific debt case
   */
  generatePersonalizedFirstMessage(
    customerName: string,
    companyName: string,
    debtAmount: number,
    currency: string,
    language = 'es'
  ): string {
    if (language === 'es') {
      return `Hola ${customerName}, le llamo de ${companyName}. Estamos contactando con usted en relación a una factura pendiente por un importe de ${debtAmount} ${currency}. ¿Es un buen momento para hablar?`;
    }

    return `Hello ${customerName}, I'm calling from ${companyName}. We're contacting you regarding an outstanding invoice for ${debtAmount} ${currency}. Is this a good time to talk?`;
  }

  // ---------------------------------------------------------------------------
  // PROMPT TEMPLATES
  // ---------------------------------------------------------------------------

  private getDebtCollectionPrompt(companyName: string, language: string): string {
    if (language === 'es') {
      return `Eres un agente de cobros profesional y empático que representa a ${companyName}. Tu objetivo es ayudar a los clientes a resolver sus facturas pendientes de manera amable y constructiva.

DIRECTRICES:
1. Sé siempre educado, profesional y comprensivo
2. Escucha activamente las preocupaciones del cliente
3. Ofrece soluciones flexibles como planes de pago
4. Nunca amenaces ni uses lenguaje agresivo
5. Si el cliente disputa la deuda, registra sus razones
6. Si el cliente necesita tiempo, programa una llamada de seguimiento
7. Confirma cualquier acuerdo de pago verbalmente

INFORMACIÓN A RECOPILAR:
- Confirmación de identidad del cliente
- Razón del impago (si aplica)
- Capacidad de pago actual
- Preferencia de método de pago
- Fecha de compromiso de pago

RESULTADOS POSIBLES:
- promise_to_pay: El cliente se compromete a pagar en una fecha específica
- payment_plan_agreed: Se acuerda un plan de pagos
- dispute: El cliente disputa la deuda
- callback_requested: El cliente solicita llamar más tarde
- not_interested: El cliente no desea continuar la conversación`;
    }

    return `You are a professional and empathetic debt collection agent representing ${companyName}. Your goal is to help customers resolve their outstanding invoices in a friendly and constructive manner.

GUIDELINES:
1. Always be polite, professional, and understanding
2. Actively listen to customer concerns
3. Offer flexible solutions like payment plans
4. Never threaten or use aggressive language
5. If the customer disputes the debt, record their reasons
6. If the customer needs time, schedule a follow-up call
7. Verbally confirm any payment agreements

INFORMATION TO COLLECT:
- Customer identity confirmation
- Reason for non-payment (if applicable)
- Current payment capacity
- Preferred payment method
- Commitment payment date

POSSIBLE OUTCOMES:
- promise_to_pay: Customer commits to pay on a specific date
- payment_plan_agreed: Payment plan is agreed
- dispute: Customer disputes the debt
- callback_requested: Customer requests to call back later
- not_interested: Customer doesn't want to continue the conversation`;
  }

  private getDebtCollectionFirstMessage(
    companyName: string,
    language: string
  ): string {
    if (language === 'es') {
      return `Hola, le llamo de ${companyName}. Estamos contactando con usted en relación a una factura pendiente. ¿Con quién tengo el gusto de hablar?`;
    }

    return `Hello, I'm calling from ${companyName}. We're contacting you regarding an outstanding invoice. Who am I speaking with?`;
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

let elevenLabsServiceInstance: ElevenLabsService | null = null;

export function getElevenLabsService(): ElevenLabsService {
  if (!elevenLabsServiceInstance) {
    elevenLabsServiceInstance = new ElevenLabsService();
  }
  return elevenLabsServiceInstance;
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type {
  CreateAgentParams,
  OutboundCallParams,
  OutboundCallResponse,
  BatchCallParams,
  BatchCallResponse,
  CallStatusResponse,
  VoiceInfo,
  ElevenLabsAgentListItem,
  ListAgentsResponse,
};
