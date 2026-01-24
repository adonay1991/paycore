/**
 * Database Schema - Drizzle ORM
 *
 * Complete database schema for the PayCore platform.
 * Following patterns from docs/DATA_ARCHITECTURE.md
 */

import { relations } from 'drizzle-orm';
import {
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

// =============================================================================
// ENUMS
// =============================================================================

export const userRoleEnum = pgEnum('user_role', [
  'admin',
  'manager',
  'user',
  'readonly',
]);

export const invoiceStatusEnum = pgEnum('invoice_status', [
  'draft',
  'pending',
  'sent',
  'paid',
  'partial',
  'overdue',
  'cancelled',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'processing',
  'completed',
  'failed',
  'refunded',
  'cancelled',
]);

export const paymentMethodEnum = pgEnum('payment_method', [
  'bank_transfer',
  'card',
  'direct_debit',
  'cash',
  'other',
]);

export const debtCaseStatusEnum = pgEnum('debt_case_status', [
  'new',
  'contacted',
  'in_progress',
  'payment_plan',
  'resolved',
  'escalated',
  'legal',
  'closed',
  'written_off',
]);

export const debtCasePriorityEnum = pgEnum('debt_case_priority', [
  'low',
  'medium',
  'high',
  'critical',
]);

export const currencyEnum = pgEnum('currency', ['EUR', 'USD', 'GBP']);

export const entityTypeEnum = pgEnum('entity_type', [
  'company',
  'user',
  'invoice',
  'payment',
  'debt_case',
]);

export const activityActionEnum = pgEnum('activity_action', [
  'created',
  'updated',
  'deleted',
  'viewed',
  'sent',
  'paid',
  'assigned',
  'status_changed',
  'comment_added',
  'exported',
]);

// Voice agent and campaigns enums
export const voiceCallStatusEnum = pgEnum('voice_call_status', [
  'pending',
  'in_progress',
  'completed',
  'failed',
  'no_answer',
  'voicemail',
  'busy',
  'cancelled',
]);

export const voiceCallOutcomeEnum = pgEnum('voice_call_outcome', [
  'promise_to_pay',
  'payment_plan_agreed',
  'dispute',
  'callback_requested',
  'wrong_number',
  'not_interested',
  'escalate',
  'no_outcome',
]);

export const campaignStatusEnum = pgEnum('campaign_status', [
  'draft',
  'scheduled',
  'running',
  'paused',
  'completed',
  'cancelled',
]);

export const campaignTypeEnum = pgEnum('campaign_type', [
  'voice',
  'email',
  'sms',
  'mixed',
]);

export const templateTypeEnum = pgEnum('template_type', [
  'voice_script',
  'email',
  'sms',
]);

export const paymentPlanStatusEnum = pgEnum('payment_plan_status', [
  'proposed',
  'active',
  'completed',
  'defaulted',
  'cancelled',
]);

export const installmentStatusEnum = pgEnum('installment_status', [
  'pending',
  'paid',
  'overdue',
  'partial',
  'cancelled',
]);

export const escalationRuleActionEnum = pgEnum('escalation_rule_action', [
  'send_email',
  'send_sms',
  'voice_call',
  'assign_agent',
  'escalate_priority',
  'create_debt_case',
  'add_to_campaign',
]);

// =============================================================================
// TABLES
// =============================================================================

/**
 * Companies table - multi-tenant organizations
 */
export const companies = pgTable(
  'companies',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    taxId: varchar('tax_id', { length: 50 }).notNull(),
    address: text('address').notNull(),
    city: varchar('city', { length: 100 }).notNull(),
    postalCode: varchar('postal_code', { length: 20 }).notNull(),
    country: varchar('country', { length: 2 }).notNull(), // ISO 3166-1 alpha-2
    email: varchar('email', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 50 }),
    website: varchar('website', { length: 255 }),
    logoUrl: varchar('logo_url', { length: 500 }),
    currency: currencyEnum('currency').notNull().default('EUR'),
    settings: jsonb('settings')
      .notNull()
      .$type<{
        invoicePrefix: string;
        invoiceNextNumber: number;
        paymentTermsDays: number;
        reminderEnabled: boolean;
        reminderDays: number[];
        overdueGraceDays: number;
        defaultCurrency: 'EUR' | 'USD' | 'GBP';
      }>()
      .default({
        invoicePrefix: 'INV',
        invoiceNextNumber: 1,
        paymentTermsDays: 30,
        reminderEnabled: true,
        reminderDays: [7, 14, 21],
        overdueGraceDays: 3,
        defaultCurrency: 'EUR',
      }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_companies_tax_id').on(table.taxId),
    index('idx_companies_email').on(table.email),
    index('idx_companies_deleted_at').on(table.deletedAt),
  ]
);

/**
 * Users table - authenticated users
 */
export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    role: userRoleEnum('role').notNull().default('user'),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    avatarUrl: varchar('avatar_url', { length: 500 }),
    phone: varchar('phone', { length: 50 }),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_users_company_id').on(table.companyId),
    index('idx_users_email').on(table.email),
    index('idx_users_role').on(table.role),
    index('idx_users_deleted_at').on(table.deletedAt),
  ]
);

/**
 * Customers table - invoice recipients
 */
export const customers = pgTable(
  'customers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    taxId: varchar('tax_id', { length: 50 }),
    address: text('address').notNull(),
    city: varchar('city', { length: 100 }).notNull(),
    postalCode: varchar('postal_code', { length: 20 }).notNull(),
    country: varchar('country', { length: 2 }).notNull(),
    phone: varchar('phone', { length: 50 }),
    contactPerson: varchar('contact_person', { length: 255 }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_customers_company_id').on(table.companyId),
    index('idx_customers_email').on(table.email),
    index('idx_customers_deleted_at').on(table.deletedAt),
  ]
);

/**
 * Invoices table - core billing documents
 */
export const invoices = pgTable(
  'invoices',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    number: varchar('number', { length: 50 }).notNull(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'restrict' }),
    status: invoiceStatusEnum('status').notNull().default('draft'),
    issueDate: timestamp('issue_date', { withTimezone: true }).notNull(),
    dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
    subtotal: decimal('subtotal', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    taxRate: decimal('tax_rate', { precision: 5, scale: 2 })
      .notNull()
      .default('21'),
    taxAmount: decimal('tax_amount', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    total: decimal('total', { precision: 12, scale: 2 }).notNull().default('0'),
    paidAmount: decimal('paid_amount', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    currency: currencyEnum('currency').notNull().default('EUR'),
    notes: text('notes'),
    termsAndConditions: text('terms_and_conditions'),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_invoices_company_id').on(table.companyId),
    index('idx_invoices_customer_id').on(table.customerId),
    index('idx_invoices_status').on(table.status),
    index('idx_invoices_due_date').on(table.dueDate),
    index('idx_invoices_number').on(table.number),
    index('idx_invoices_company_status').on(table.companyId, table.status),
    index('idx_invoices_deleted_at').on(table.deletedAt),
  ]
);

/**
 * Invoice items table - line items
 */
export const invoiceItems = pgTable(
  'invoice_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    invoiceId: uuid('invoice_id')
      .notNull()
      .references(() => invoices.id, { onDelete: 'cascade' }),
    description: text('description').notNull(),
    quantity: decimal('quantity', { precision: 10, scale: 4 })
      .notNull()
      .default('1'),
    unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).notNull(),
    taxRate: decimal('tax_rate', { precision: 5, scale: 2 })
      .notNull()
      .default('21'),
    total: decimal('total', { precision: 12, scale: 2 }).notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index('idx_invoice_items_invoice_id').on(table.invoiceId)]
);

/**
 * Payments table - payment records
 */
export const payments = pgTable(
  'payments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    invoiceId: uuid('invoice_id')
      .notNull()
      .references(() => invoices.id, { onDelete: 'cascade' }),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    currency: currencyEnum('currency').notNull().default('EUR'),
    method: paymentMethodEnum('method').notNull(),
    status: paymentStatusEnum('status').notNull().default('pending'),
    reference: varchar('reference', { length: 255 }),
    transactionId: varchar('transaction_id', { length: 255 }),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    failedAt: timestamp('failed_at', { withTimezone: true }),
    failureReason: text('failure_reason'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_payments_invoice_id').on(table.invoiceId),
    index('idx_payments_status').on(table.status),
    index('idx_payments_method').on(table.method),
  ]
);

/**
 * Debt cases table - debt recovery workflow
 */
export const debtCases = pgTable(
  'debt_cases',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    invoiceId: uuid('invoice_id')
      .notNull()
      .references(() => invoices.id, { onDelete: 'cascade' }),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    status: debtCaseStatusEnum('status').notNull().default('new'),
    priority: debtCasePriorityEnum('priority').notNull().default('medium'),
    assignedToId: uuid('assigned_to_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    totalDebt: decimal('total_debt', { precision: 12, scale: 2 }).notNull(),
    currency: currencyEnum('currency').notNull().default('EUR'),
    lastContactAt: timestamp('last_contact_at', { withTimezone: true }),
    nextActionAt: timestamp('next_action_at', { withTimezone: true }),
    nextAction: text('next_action'),
    escalatedAt: timestamp('escalated_at', { withTimezone: true }),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_debt_cases_invoice_id').on(table.invoiceId),
    index('idx_debt_cases_company_id').on(table.companyId),
    index('idx_debt_cases_status').on(table.status),
    index('idx_debt_cases_priority').on(table.priority),
    index('idx_debt_cases_assigned_to').on(table.assignedToId),
    index('idx_debt_cases_deleted_at').on(table.deletedAt),
  ]
);

/**
 * Debt case activities table - activity log
 */
export const debtCaseActivities = pgTable(
  'debt_case_activities',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    debtCaseId: uuid('debt_case_id')
      .notNull()
      .references(() => debtCases.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    action: varchar('action', { length: 100 }).notNull(),
    notes: text('notes'),
    contactMethod: varchar('contact_method', { length: 50 }),
    outcome: varchar('outcome', { length: 100 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_debt_case_activities_debt_case_id').on(table.debtCaseId),
    index('idx_debt_case_activities_user_id').on(table.userId),
  ]
);

/**
 * Voice agents table - ElevenLabs conversational AI agents
 */
export const voiceAgents = pgTable(
  'voice_agents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    elevenLabsAgentId: varchar('elevenlabs_agent_id', { length: 255 }),
    voiceId: varchar('voice_id', { length: 255 }).notNull(),
    language: varchar('language', { length: 10 }).notNull().default('es'),
    systemPrompt: text('system_prompt').notNull(),
    firstMessage: text('first_message').notNull(),
    settings: jsonb('settings')
      .notNull()
      .$type<{
        maxCallDuration: number;
        temperature: number;
        stability: number;
        similarityBoost: number;
        enableTranscription: boolean;
        enableRecording: boolean;
      }>()
      .default({
        maxCallDuration: 300,
        temperature: 0.5,
        stability: 0.5,
        similarityBoost: 0.75,
        enableTranscription: true,
        enableRecording: true,
      }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_voice_agents_company_id').on(table.companyId),
    index('idx_voice_agents_elevenlabs_id').on(table.elevenLabsAgentId),
  ]
);

/**
 * Voice calls table - individual call records
 */
export const voiceCalls = pgTable(
  'voice_calls',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    debtCaseId: uuid('debt_case_id').references(() => debtCases.id, {
      onDelete: 'set null',
    }),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    voiceAgentId: uuid('voice_agent_id').references(() => voiceAgents.id, {
      onDelete: 'set null',
    }),
    campaignId: uuid('campaign_id'),
    elevenLabsCallId: varchar('elevenlabs_call_id', { length: 255 }),
    twilioCallSid: varchar('twilio_call_sid', { length: 255 }),
    phoneNumber: varchar('phone_number', { length: 50 }).notNull(),
    status: voiceCallStatusEnum('status').notNull().default('pending'),
    outcome: voiceCallOutcomeEnum('outcome'),
    direction: varchar('direction', { length: 10 }).notNull().default('outbound'),
    duration: integer('duration'), // seconds
    recordingUrl: varchar('recording_url', { length: 500 }),
    transcription: text('transcription'),
    summary: text('summary'),
    sentiment: varchar('sentiment', { length: 20 }),
    metadata: jsonb('metadata').$type<{
      promisedAmount?: number;
      promisedDate?: string;
      callbackDate?: string;
      disputeReason?: string;
      notes?: string;
    }>(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_voice_calls_company_id').on(table.companyId),
    index('idx_voice_calls_debt_case_id').on(table.debtCaseId),
    index('idx_voice_calls_customer_id').on(table.customerId),
    index('idx_voice_calls_campaign_id').on(table.campaignId),
    index('idx_voice_calls_status').on(table.status),
    index('idx_voice_calls_created_at').on(table.createdAt),
  ]
);

/**
 * Communication templates table - email, SMS, voice scripts
 */
export const communicationTemplates = pgTable(
  'communication_templates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    type: templateTypeEnum('type').notNull(),
    subject: varchar('subject', { length: 255 }), // for email
    content: text('content').notNull(),
    language: varchar('language', { length: 10 }).notNull().default('es'),
    variables: jsonb('variables')
      .$type<string[]>()
      .notNull()
      .default([]),
    daysOverdue: integer('days_overdue'), // when to use this template
    isDefault: boolean('is_default').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_communication_templates_company_id').on(table.companyId),
    index('idx_communication_templates_type').on(table.type),
  ]
);

/**
 * Collection campaigns table - automated outreach campaigns
 */
export const collectionCampaigns = pgTable(
  'collection_campaigns',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    type: campaignTypeEnum('type').notNull(),
    status: campaignStatusEnum('status').notNull().default('draft'),
    voiceAgentId: uuid('voice_agent_id').references(() => voiceAgents.id, {
      onDelete: 'set null',
    }),
    templateId: uuid('template_id').references(() => communicationTemplates.id, {
      onDelete: 'set null',
    }),
    filters: jsonb('filters')
      .notNull()
      .$type<{
        minDebtAmount?: number;
        maxDebtAmount?: number;
        daysOverdueMin?: number;
        daysOverdueMax?: number;
        priorities?: string[];
        statuses?: string[];
      }>()
      .default({}),
    schedule: jsonb('schedule')
      .notNull()
      .$type<{
        startTime: string; // HH:mm
        endTime: string; // HH:mm
        timezone: string;
        daysOfWeek: number[]; // 0-6, Sunday = 0
        maxCallsPerDay?: number;
        maxCallsPerHour?: number;
      }>()
      .default({
        startTime: '09:00',
        endTime: '18:00',
        timezone: 'Europe/Madrid',
        daysOfWeek: [1, 2, 3, 4, 5],
      }),
    stats: jsonb('stats')
      .$type<{
        totalContacts: number;
        contacted: number;
        successful: number;
        failed: number;
        pending: number;
      }>()
      .default({
        totalContacts: 0,
        contacted: 0,
        successful: 0,
        failed: 0,
        pending: 0,
      }),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_collection_campaigns_company_id').on(table.companyId),
    index('idx_collection_campaigns_status').on(table.status),
    index('idx_collection_campaigns_type').on(table.type),
  ]
);

/**
 * Campaign contacts table - contacts assigned to campaigns
 */
export const campaignContacts = pgTable(
  'campaign_contacts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    campaignId: uuid('campaign_id')
      .notNull()
      .references(() => collectionCampaigns.id, { onDelete: 'cascade' }),
    debtCaseId: uuid('debt_case_id')
      .notNull()
      .references(() => debtCases.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    status: varchar('status', { length: 50 }).notNull().default('pending'),
    attempts: integer('attempts').notNull().default(0),
    maxAttempts: integer('max_attempts').notNull().default(3),
    lastAttemptAt: timestamp('last_attempt_at', { withTimezone: true }),
    nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    outcome: voiceCallOutcomeEnum('outcome'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_campaign_contacts_campaign_id').on(table.campaignId),
    index('idx_campaign_contacts_debt_case_id').on(table.debtCaseId),
    index('idx_campaign_contacts_status').on(table.status),
    index('idx_campaign_contacts_next_attempt').on(table.nextAttemptAt),
  ]
);

/**
 * Payment plans table - structured payment arrangements
 */
export const paymentPlans = pgTable(
  'payment_plans',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    debtCaseId: uuid('debt_case_id')
      .notNull()
      .references(() => debtCases.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    status: paymentPlanStatusEnum('status').notNull().default('proposed'),
    totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
    downPayment: decimal('down_payment', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    numberOfInstallments: integer('number_of_installments').notNull(),
    installmentAmount: decimal('installment_amount', { precision: 12, scale: 2 }).notNull(),
    frequency: varchar('frequency', { length: 20 }).notNull().default('monthly'),
    currency: currencyEnum('currency').notNull().default('EUR'),
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    endDate: timestamp('end_date', { withTimezone: true }),
    paidAmount: decimal('paid_amount', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    remainingAmount: decimal('remaining_amount', { precision: 12, scale: 2 }).notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    defaultedAt: timestamp('defaulted_at', { withTimezone: true }),
    notes: text('notes'),
    createdByVoiceCall: uuid('created_by_voice_call').references(() => voiceCalls.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_payment_plans_company_id').on(table.companyId),
    index('idx_payment_plans_debt_case_id').on(table.debtCaseId),
    index('idx_payment_plans_customer_id').on(table.customerId),
    index('idx_payment_plans_status').on(table.status),
  ]
);

/**
 * Installments table - individual payment plan installments
 */
export const installments = pgTable(
  'installments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    paymentPlanId: uuid('payment_plan_id')
      .notNull()
      .references(() => paymentPlans.id, { onDelete: 'cascade' }),
    installmentNumber: integer('installment_number').notNull(),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
    status: installmentStatusEnum('status').notNull().default('pending'),
    paidAmount: decimal('paid_amount', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    paymentId: uuid('payment_id').references(() => payments.id, {
      onDelete: 'set null',
    }),
    reminderSentAt: timestamp('reminder_sent_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_installments_payment_plan_id').on(table.paymentPlanId),
    index('idx_installments_due_date').on(table.dueDate),
    index('idx_installments_status').on(table.status),
  ]
);

/**
 * Escalation rules table - automated escalation configuration
 */
export const escalationRules = pgTable(
  'escalation_rules',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    priority: integer('priority').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    conditions: jsonb('conditions')
      .notNull()
      .$type<{
        daysOverdue?: { min?: number; max?: number };
        debtAmount?: { min?: number; max?: number };
        currentStatus?: string[];
        previousAttempts?: { min?: number; max?: number };
        lastContactDaysAgo?: { min?: number; max?: number };
      }>()
      .default({}),
    actions: jsonb('actions')
      .notNull()
      .$type<{
        type: string;
        params: Record<string, unknown>;
      }[]>()
      .default([]),
    cooldownHours: integer('cooldown_hours').notNull().default(24),
    maxExecutions: integer('max_executions'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_escalation_rules_company_id').on(table.companyId),
    index('idx_escalation_rules_priority').on(table.priority),
  ]
);

/**
 * Escalation rule executions table - track rule executions
 */
export const escalationRuleExecutions = pgTable(
  'escalation_rule_executions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ruleId: uuid('rule_id')
      .notNull()
      .references(() => escalationRules.id, { onDelete: 'cascade' }),
    debtCaseId: uuid('debt_case_id')
      .notNull()
      .references(() => debtCases.id, { onDelete: 'cascade' }),
    actionsTaken: jsonb('actions_taken')
      .$type<{
        type: string;
        success: boolean;
        result?: Record<string, unknown>;
        error?: string;
      }[]>()
      .notNull()
      .default([]),
    executedAt: timestamp('executed_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_rule_executions_rule_id').on(table.ruleId),
    index('idx_rule_executions_debt_case_id').on(table.debtCaseId),
    index('idx_rule_executions_executed_at').on(table.executedAt),
  ]
);

/**
 * Audit logs table - system activity tracking
 */
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    entityType: entityTypeEnum('entity_type').notNull(),
    entityId: uuid('entity_id').notNull(),
    action: activityActionEnum('action').notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    changes: jsonb('changes').$type<Record<string, unknown>>(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_audit_logs_entity').on(table.entityType, table.entityId),
    index('idx_audit_logs_user_id').on(table.userId),
    index('idx_audit_logs_company_id').on(table.companyId),
    index('idx_audit_logs_action').on(table.action),
    index('idx_audit_logs_created_at').on(table.createdAt),
  ]
);

// =============================================================================
// RELATIONS
// =============================================================================

export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(users),
  customers: many(customers),
  invoices: many(invoices),
  debtCases: many(debtCases),
  auditLogs: many(auditLogs),
  voiceAgents: many(voiceAgents),
  voiceCalls: many(voiceCalls),
  communicationTemplates: many(communicationTemplates),
  collectionCampaigns: many(collectionCampaigns),
  paymentPlans: many(paymentPlans),
  escalationRules: many(escalationRules),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
  assignedDebtCases: many(debtCases),
  debtCaseActivities: many(debtCaseActivities),
  auditLogs: many(auditLogs),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  company: one(companies, {
    fields: [customers.companyId],
    references: [companies.id],
  }),
  invoices: many(invoices),
  voiceCalls: many(voiceCalls),
  paymentPlans: many(paymentPlans),
  campaignContacts: many(campaignContacts),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  company: one(companies, {
    fields: [invoices.companyId],
    references: [companies.id],
  }),
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  items: many(invoiceItems),
  payments: many(payments),
  debtCases: many(debtCases),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
}));

export const debtCasesRelations = relations(debtCases, ({ one, many }) => ({
  invoice: one(invoices, {
    fields: [debtCases.invoiceId],
    references: [invoices.id],
  }),
  company: one(companies, {
    fields: [debtCases.companyId],
    references: [companies.id],
  }),
  assignedTo: one(users, {
    fields: [debtCases.assignedToId],
    references: [users.id],
  }),
  activities: many(debtCaseActivities),
  voiceCalls: many(voiceCalls),
  paymentPlans: many(paymentPlans),
  campaignContacts: many(campaignContacts),
  ruleExecutions: many(escalationRuleExecutions),
}));

export const debtCaseActivitiesRelations = relations(
  debtCaseActivities,
  ({ one }) => ({
    debtCase: one(debtCases, {
      fields: [debtCaseActivities.debtCaseId],
      references: [debtCases.id],
    }),
    user: one(users, {
      fields: [debtCaseActivities.userId],
      references: [users.id],
    }),
  })
);

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [auditLogs.companyId],
    references: [companies.id],
  }),
}));

// Voice agents relations
export const voiceAgentsRelations = relations(voiceAgents, ({ one, many }) => ({
  company: one(companies, {
    fields: [voiceAgents.companyId],
    references: [companies.id],
  }),
  voiceCalls: many(voiceCalls),
  campaigns: many(collectionCampaigns),
}));

// Voice calls relations
export const voiceCallsRelations = relations(voiceCalls, ({ one }) => ({
  company: one(companies, {
    fields: [voiceCalls.companyId],
    references: [companies.id],
  }),
  debtCase: one(debtCases, {
    fields: [voiceCalls.debtCaseId],
    references: [debtCases.id],
  }),
  customer: one(customers, {
    fields: [voiceCalls.customerId],
    references: [customers.id],
  }),
  voiceAgent: one(voiceAgents, {
    fields: [voiceCalls.voiceAgentId],
    references: [voiceAgents.id],
  }),
}));

// Communication templates relations
export const communicationTemplatesRelations = relations(
  communicationTemplates,
  ({ one, many }) => ({
    company: one(companies, {
      fields: [communicationTemplates.companyId],
      references: [companies.id],
    }),
    campaigns: many(collectionCampaigns),
  })
);

// Collection campaigns relations
export const collectionCampaignsRelations = relations(
  collectionCampaigns,
  ({ one, many }) => ({
    company: one(companies, {
      fields: [collectionCampaigns.companyId],
      references: [companies.id],
    }),
    voiceAgent: one(voiceAgents, {
      fields: [collectionCampaigns.voiceAgentId],
      references: [voiceAgents.id],
    }),
    template: one(communicationTemplates, {
      fields: [collectionCampaigns.templateId],
      references: [communicationTemplates.id],
    }),
    contacts: many(campaignContacts),
  })
);

// Campaign contacts relations
export const campaignContactsRelations = relations(
  campaignContacts,
  ({ one }) => ({
    campaign: one(collectionCampaigns, {
      fields: [campaignContacts.campaignId],
      references: [collectionCampaigns.id],
    }),
    debtCase: one(debtCases, {
      fields: [campaignContacts.debtCaseId],
      references: [debtCases.id],
    }),
    customer: one(customers, {
      fields: [campaignContacts.customerId],
      references: [customers.id],
    }),
  })
);

// Payment plans relations
export const paymentPlansRelations = relations(paymentPlans, ({ one, many }) => ({
  company: one(companies, {
    fields: [paymentPlans.companyId],
    references: [companies.id],
  }),
  debtCase: one(debtCases, {
    fields: [paymentPlans.debtCaseId],
    references: [debtCases.id],
  }),
  customer: one(customers, {
    fields: [paymentPlans.customerId],
    references: [customers.id],
  }),
  installments: many(installments),
  createdByCall: one(voiceCalls, {
    fields: [paymentPlans.createdByVoiceCall],
    references: [voiceCalls.id],
  }),
}));

// Installments relations
export const installmentsRelations = relations(installments, ({ one }) => ({
  paymentPlan: one(paymentPlans, {
    fields: [installments.paymentPlanId],
    references: [paymentPlans.id],
  }),
  payment: one(payments, {
    fields: [installments.paymentId],
    references: [payments.id],
  }),
}));

// Escalation rules relations
export const escalationRulesRelations = relations(
  escalationRules,
  ({ one, many }) => ({
    company: one(companies, {
      fields: [escalationRules.companyId],
      references: [companies.id],
    }),
    executions: many(escalationRuleExecutions),
  })
);

// Escalation rule executions relations
export const escalationRuleExecutionsRelations = relations(
  escalationRuleExecutions,
  ({ one }) => ({
    rule: one(escalationRules, {
      fields: [escalationRuleExecutions.ruleId],
      references: [escalationRules.id],
    }),
    debtCase: one(debtCases, {
      fields: [escalationRuleExecutions.debtCaseId],
      references: [debtCases.id],
    }),
  })
);

// =============================================================================
// TYPE EXPORTS (for use with Drizzle ORM)
// =============================================================================

export type CompanyRow = typeof companies.$inferSelect;
export type NewCompanyRow = typeof companies.$inferInsert;

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;

export type CustomerRow = typeof customers.$inferSelect;
export type NewCustomerRow = typeof customers.$inferInsert;

export type InvoiceRow = typeof invoices.$inferSelect;
export type NewInvoiceRow = typeof invoices.$inferInsert;

export type InvoiceItemRow = typeof invoiceItems.$inferSelect;
export type NewInvoiceItemRow = typeof invoiceItems.$inferInsert;

export type PaymentRow = typeof payments.$inferSelect;
export type NewPaymentRow = typeof payments.$inferInsert;

export type DebtCaseRow = typeof debtCases.$inferSelect;
export type NewDebtCaseRow = typeof debtCases.$inferInsert;

export type DebtCaseActivityRow = typeof debtCaseActivities.$inferSelect;
export type NewDebtCaseActivityRow = typeof debtCaseActivities.$inferInsert;

export type AuditLogRow = typeof auditLogs.$inferSelect;
export type NewAuditLogRow = typeof auditLogs.$inferInsert;

export type VoiceAgentRow = typeof voiceAgents.$inferSelect;
export type NewVoiceAgentRow = typeof voiceAgents.$inferInsert;

export type VoiceCallRow = typeof voiceCalls.$inferSelect;
export type NewVoiceCallRow = typeof voiceCalls.$inferInsert;

export type CommunicationTemplateRow = typeof communicationTemplates.$inferSelect;
export type NewCommunicationTemplateRow = typeof communicationTemplates.$inferInsert;

export type CollectionCampaignRow = typeof collectionCampaigns.$inferSelect;
export type NewCollectionCampaignRow = typeof collectionCampaigns.$inferInsert;

export type CampaignContactRow = typeof campaignContacts.$inferSelect;
export type NewCampaignContactRow = typeof campaignContacts.$inferInsert;

export type PaymentPlanRow = typeof paymentPlans.$inferSelect;
export type NewPaymentPlanRow = typeof paymentPlans.$inferInsert;

export type InstallmentRow = typeof installments.$inferSelect;
export type NewInstallmentRow = typeof installments.$inferInsert;

export type EscalationRuleRow = typeof escalationRules.$inferSelect;
export type NewEscalationRuleRow = typeof escalationRules.$inferInsert;

export type EscalationRuleExecutionRow = typeof escalationRuleExecutions.$inferSelect;
export type NewEscalationRuleExecutionRow = typeof escalationRuleExecutions.$inferInsert;
