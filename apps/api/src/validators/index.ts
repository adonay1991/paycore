/**
 * Zod Validation Schemas
 *
 * Runtime validation schemas for all API inputs.
 * Following patterns from docs/SECURITY_GUIDE.md#input-validation--sanitization
 */

import { z } from 'zod';

// =============================================================================
// COMMON SCHEMAS
// =============================================================================

export const uuidSchema = z.string().uuid('Invalid UUID format');

export const emailSchema = z.string().email('Invalid email format').max(255);

export const phoneSchema = z
  .string()
  .max(50)
  .regex(/^[+]?[\d\s()-]+$/, 'Invalid phone number format')
  .optional()
  .nullable();

export const currencySchema = z.enum(['EUR', 'USD', 'GBP']);

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =============================================================================
// COMPANY SCHEMAS
// =============================================================================

export const createCompanySchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  taxId: z.string().min(1, 'Tax ID is required').max(50),
  address: z.string().min(1, 'Address is required').max(500),
  city: z.string().min(1, 'City is required').max(100),
  postalCode: z.string().min(1, 'Postal code is required').max(20),
  country: z
    .string()
    .length(2, 'Country must be 2-letter ISO code')
    .toUpperCase(),
  email: emailSchema,
  phone: phoneSchema,
  website: z.string().url().max(255).optional().nullable(),
  currency: currencySchema.optional().default('EUR'),
});

export const updateCompanySchema = createCompanySchema.partial().extend({
  settings: z
    .object({
      invoicePrefix: z.string().max(10).optional(),
      invoiceNextNumber: z.number().int().positive().optional(),
      paymentTermsDays: z.number().int().min(0).max(365).optional(),
      reminderEnabled: z.boolean().optional(),
      reminderDays: z.array(z.number().int().min(1).max(90)).optional(),
      overdueGraceDays: z.number().int().min(0).max(30).optional(),
      defaultCurrency: currencySchema.optional(),
    })
    .optional(),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;

// =============================================================================
// USER SCHEMAS
// =============================================================================

export const userRoleSchema = z.enum(['admin', 'manager', 'user', 'readonly']);

export const createUserSchema = z.object({
  email: emailSchema,
  name: z.string().min(1, 'Name is required').max(255),
  role: userRoleSchema.default('user'),
  companyId: uuidSchema,
  phone: phoneSchema,
});

export const updateUserSchema = z.object({
  email: emailSchema.optional(),
  name: z.string().min(1).max(255).optional(),
  role: userRoleSchema.optional(),
  phone: phoneSchema,
  isActive: z.boolean().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// =============================================================================
// CUSTOMER SCHEMAS
// =============================================================================

export const createCustomerSchema = z.object({
  companyId: uuidSchema,
  name: z.string().min(1, 'Name is required').max(255),
  email: emailSchema,
  taxId: z.string().max(50).optional().nullable(),
  address: z.string().min(1, 'Address is required').max(500),
  city: z.string().min(1, 'City is required').max(100),
  postalCode: z.string().min(1, 'Postal code is required').max(20),
  country: z
    .string()
    .length(2, 'Country must be 2-letter ISO code')
    .toUpperCase(),
  phone: phoneSchema,
  contactPerson: z.string().max(255).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateCustomerSchema = createCustomerSchema
  .omit({ companyId: true })
  .partial();

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

// =============================================================================
// INVOICE SCHEMAS
// =============================================================================

export const invoiceStatusSchema = z.enum([
  'draft',
  'pending',
  'sent',
  'paid',
  'partial',
  'overdue',
  'cancelled',
]);

export const createInvoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required').max(500),
  quantity: z.coerce.number().positive('Quantity must be positive'),
  unitPrice: z.coerce.number().min(0, 'Unit price cannot be negative'),
  taxRate: z.coerce.number().min(0).max(100).default(21),
});

export const createInvoiceSchema = z.object({
  companyId: uuidSchema,
  customerId: uuidSchema,
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  currency: currencySchema.optional().default('EUR'),
  notes: z.string().max(2000).optional().nullable(),
  termsAndConditions: z.string().max(5000).optional().nullable(),
  items: z
    .array(createInvoiceItemSchema)
    .min(1, 'At least one item is required'),
});

export const updateInvoiceSchema = z.object({
  customerId: uuidSchema.optional(),
  issueDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  currency: currencySchema.optional(),
  notes: z.string().max(2000).optional().nullable(),
  termsAndConditions: z.string().max(5000).optional().nullable(),
  status: invoiceStatusSchema.optional(),
  items: z.array(createInvoiceItemSchema).optional(),
});

export const invoiceFilterSchema = paginationSchema.extend({
  status: z.union([invoiceStatusSchema, z.array(invoiceStatusSchema)]).optional(),
  customerId: uuidSchema.optional(),
  companyId: uuidSchema.optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  search: z.string().max(100).optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type InvoiceFilterInput = z.infer<typeof invoiceFilterSchema>;

// =============================================================================
// PAYMENT SCHEMAS
// =============================================================================

export const paymentStatusSchema = z.enum([
  'pending',
  'processing',
  'completed',
  'failed',
  'refunded',
  'cancelled',
]);

export const paymentMethodSchema = z.enum([
  'bank_transfer',
  'card',
  'direct_debit',
  'cash',
  'other',
]);

export const createPaymentSchema = z.object({
  invoiceId: uuidSchema,
  amount: z.coerce.number().positive('Amount must be positive'),
  method: paymentMethodSchema,
  reference: z.string().max(255).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const updatePaymentSchema = z.object({
  status: paymentStatusSchema.optional(),
  transactionId: z.string().max(255).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const paymentFilterSchema = paginationSchema.extend({
  status: z.union([paymentStatusSchema, z.array(paymentStatusSchema)]).optional(),
  invoiceId: uuidSchema.optional(),
  method: paymentMethodSchema.optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type PaymentFilterInput = z.infer<typeof paymentFilterSchema>;

// =============================================================================
// DEBT CASE SCHEMAS
// =============================================================================

export const debtCaseStatusSchema = z.enum([
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

export const debtCasePrioritySchema = z.enum([
  'low',
  'medium',
  'high',
  'critical',
]);

export const createDebtCaseSchema = z.object({
  invoiceId: uuidSchema,
  priority: debtCasePrioritySchema.optional().default('medium'),
  assignedToId: uuidSchema.optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateDebtCaseSchema = z.object({
  status: debtCaseStatusSchema.optional(),
  priority: debtCasePrioritySchema.optional(),
  assignedToId: uuidSchema.optional().nullable(),
  nextActionAt: z.coerce.date().optional().nullable(),
  nextAction: z.string().max(500).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const debtCaseFilterSchema = paginationSchema.extend({
  status: z
    .union([debtCaseStatusSchema, z.array(debtCaseStatusSchema)])
    .optional(),
  priority: z
    .union([debtCasePrioritySchema, z.array(debtCasePrioritySchema)])
    .optional(),
  assignedToId: uuidSchema.optional(),
  companyId: uuidSchema.optional(),
  minDebt: z.coerce.number().optional(),
  maxDebt: z.coerce.number().optional(),
});

export type CreateDebtCaseInput = z.infer<typeof createDebtCaseSchema>;
export type UpdateDebtCaseInput = z.infer<typeof updateDebtCaseSchema>;
export type DebtCaseFilterInput = z.infer<typeof debtCaseFilterSchema>;

// =============================================================================
// DEBT CASE ACTIVITY SCHEMAS
// =============================================================================

export const createDebtCaseActivitySchema = z.object({
  debtCaseId: uuidSchema,
  action: z.string().min(1).max(100),
  notes: z.string().max(2000).optional().nullable(),
  contactMethod: z.string().max(50).optional().nullable(),
  outcome: z.string().max(100).optional().nullable(),
});

export type CreateDebtCaseActivityInput = z.infer<
  typeof createDebtCaseActivitySchema
>;
