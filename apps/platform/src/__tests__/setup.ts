/**
 * Test Setup
 *
 * Global test setup and mocks for unit tests.
 */

import { mock } from 'bun:test';

// =============================================================================
// SUPABASE MOCK
// =============================================================================

export const mockSupabaseUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: { role: 'admin' },
};

export const mockCompanyId = 'test-company-id';

export const mockUserData = {
  id: mockSupabaseUser.id,
  company_id: mockCompanyId,
  email: mockSupabaseUser.email,
  role: 'admin',
};

// Mock query builder
export function createMockQueryBuilder<T>(data: T | T[] | null = null) {
  const builder = {
    select: mock(() => builder),
    insert: mock(() => builder),
    update: mock(() => builder),
    delete: mock(() => builder),
    eq: mock(() => builder),
    neq: mock(() => builder),
    in: mock(() => builder),
    is: mock(() => builder),
    lt: mock(() => builder),
    lte: mock(() => builder),
    gt: mock(() => builder),
    gte: mock(() => builder),
    order: mock(() => builder),
    limit: mock(() => builder),
    single: mock(() => Promise.resolve({ data, error: null })),
    maybeSingle: mock(() => Promise.resolve({ data, error: null })),
    then: mock((resolve: (value: { data: T | T[] | null; error: null }) => void) =>
      resolve({ data: Array.isArray(data) ? data : data ? [data] : [], error: null })
    ),
  };

  // Make it thenable
  Object.defineProperty(builder, 'then', {
    value: (resolve: (value: { data: T | T[] | null; error: null }) => void) => {
      return Promise.resolve({ data, error: null }).then(resolve);
    },
  });

  return builder;
}

// Mock Supabase client
export function createMockSupabaseClient(overrides: Record<string, unknown> = {}) {
  return {
    auth: {
      getUser: mock(() =>
        Promise.resolve({ data: { user: mockSupabaseUser }, error: null })
      ),
      signInWithPassword: mock(() =>
        Promise.resolve({ data: { user: mockSupabaseUser, session: {} }, error: null })
      ),
      signOut: mock(() => Promise.resolve({ error: null })),
    },
    from: mock((table: string) => {
      const tableData = (overrides[table] as unknown) || null;
      return createMockQueryBuilder(tableData);
    }),
    ...overrides,
  };
}

// =============================================================================
// ELEVENLABS MOCK
// =============================================================================

export function createMockElevenLabsClient() {
  return {
    createAgent: mock(() => Promise.resolve('mock-agent-id')),
    updateAgent: mock(() => Promise.resolve()),
    deleteAgent: mock(() => Promise.resolve()),
    getVoices: mock(() =>
      Promise.resolve([
        { voice_id: 'voice-1', name: 'Maria', labels: { language: 'es' } },
        { voice_id: 'voice-2', name: 'Carlos', labels: { language: 'es' } },
      ])
    ),
    initiateCall: mock(() =>
      Promise.resolve({
        call_id: 'mock-call-id',
        twilio_call_sid: 'mock-twilio-sid',
        status: 'pending',
      })
    ),
    getCallStatus: mock(() =>
      Promise.resolve({
        call_id: 'mock-call-id',
        status: 'completed',
        duration: 120,
        recording_url: 'https://example.com/recording.mp3',
        transcript: 'Test transcript',
        analysis: {
          summary: 'Test summary',
          sentiment: 'positive',
          outcome: 'promise_to_pay',
        },
      })
    ),
    generateFirstMessage: mock(() => 'Hello, this is a test message'),
  };
}

// =============================================================================
// TEST UTILITIES
// =============================================================================

export function createMockCustomer(overrides: Record<string, unknown> = {}) {
  return {
    id: 'customer-1',
    company_id: mockCompanyId,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+34600000001',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockDebtCase(overrides: Record<string, unknown> = {}) {
  return {
    id: 'debt-case-1',
    company_id: mockCompanyId,
    customer_id: 'customer-1',
    status: 'pending',
    priority: 'medium',
    total_debt: '1000.00',
    paid_amount: '0.00',
    currency: 'EUR',
    days_overdue: 30,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockVoiceAgent(overrides: Record<string, unknown> = {}) {
  return {
    id: 'agent-1',
    company_id: mockCompanyId,
    name: 'Test Agent',
    elevenlabs_agent_id: 'mock-elevenlabs-agent',
    voice_id: 'voice-1',
    language: 'es',
    system_prompt: 'Test prompt',
    first_message: 'Hello',
    settings: {
      maxCallDuration: 300,
      temperature: 0.5,
      stability: 0.5,
      similarityBoost: 0.75,
      enableTranscription: true,
      enableRecording: true,
    },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockCampaign(overrides: Record<string, unknown> = {}) {
  return {
    id: 'campaign-1',
    company_id: mockCompanyId,
    name: 'Test Campaign',
    description: 'Test description',
    type: 'voice',
    status: 'draft',
    voice_agent_id: 'agent-1',
    filters: {},
    schedule: {
      startTime: '09:00',
      endTime: '18:00',
      timezone: 'Europe/Madrid',
      daysOfWeek: [1, 2, 3, 4, 5],
    },
    stats: {
      totalContacts: 0,
      contacted: 0,
      successful: 0,
      failed: 0,
      pending: 0,
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockPaymentPlan(overrides: Record<string, unknown> = {}) {
  return {
    id: 'plan-1',
    company_id: mockCompanyId,
    debt_case_id: 'debt-case-1',
    customer_id: 'customer-1',
    status: 'proposed',
    total_amount: '1000.00',
    down_payment: '100.00',
    number_of_installments: 3,
    installment_amount: '300.00',
    frequency: 'monthly',
    currency: 'EUR',
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    paid_amount: '0.00',
    remaining_amount: '1000.00',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockEscalationRule(overrides: Record<string, unknown> = {}) {
  return {
    id: 'rule-1',
    company_id: mockCompanyId,
    name: 'Test Rule',
    description: 'Test description',
    priority: 1,
    is_active: true,
    conditions: {
      daysOverdue: { min: 30 },
    },
    actions: [
      { type: 'send_email', params: { templateId: 'template-1' } },
    ],
    execution_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}
