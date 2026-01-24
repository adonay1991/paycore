/**
 * @paycore/types - Shared TypeScript Types
 *
 * Core domain types for the PayCore payment and debt recovery platform.
 * These types are shared across all apps (web, platform, api) and packages.
 */

// =============================================================================
// ENUMS & CONSTANTS
// =============================================================================

/** User roles for RBAC */
export type UserRole = 'admin' | 'manager' | 'user' | 'readonly';

/** Invoice status lifecycle */
export type InvoiceStatus =
  | 'draft'
  | 'pending'
  | 'sent'
  | 'paid'
  | 'partial'
  | 'overdue'
  | 'cancelled';

/** Payment processing status */
export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'cancelled';

/** Supported payment methods */
export type PaymentMethod =
  | 'bank_transfer'
  | 'card'
  | 'direct_debit'
  | 'cash'
  | 'other';

/** Debt case status for recovery workflow */
export type DebtCaseStatus =
  | 'new'
  | 'contacted'
  | 'in_progress'
  | 'payment_plan'
  | 'resolved'
  | 'escalated'
  | 'legal'
  | 'closed'
  | 'written_off';

/** Debt case priority levels */
export type DebtCasePriority = 'low' | 'medium' | 'high' | 'critical';

/** Supported currencies */
export type Currency = 'EUR' | 'USD' | 'GBP';

/** Activity action types for audit logging */
export type ActivityAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'viewed'
  | 'sent'
  | 'paid'
  | 'assigned'
  | 'status_changed'
  | 'comment_added'
  | 'exported';

/** Entity types for polymorphic references */
export type EntityType =
  | 'company'
  | 'user'
  | 'invoice'
  | 'payment'
  | 'debt_case';

// =============================================================================
// ROLE PERMISSIONS
// =============================================================================

/** Permission types for authorization */
export type Permission =
  | 'companies:read'
  | 'companies:write'
  | 'companies:delete'
  | 'users:read'
  | 'users:write'
  | 'users:delete'
  | 'invoices:read'
  | 'invoices:write'
  | 'invoices:delete'
  | 'invoices:send'
  | 'payments:read'
  | 'payments:write'
  | 'payments:process'
  | 'payments:refund'
  | 'debt_cases:read'
  | 'debt_cases:write'
  | 'debt_cases:delete'
  | 'debt_cases:assign'
  | 'debt_cases:escalate'
  | 'reports:read'
  | 'reports:export'
  | 'settings:read'
  | 'settings:write';

/** Role to permissions mapping */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'companies:read',
    'companies:write',
    'companies:delete',
    'users:read',
    'users:write',
    'users:delete',
    'invoices:read',
    'invoices:write',
    'invoices:delete',
    'invoices:send',
    'payments:read',
    'payments:write',
    'payments:process',
    'payments:refund',
    'debt_cases:read',
    'debt_cases:write',
    'debt_cases:delete',
    'debt_cases:assign',
    'debt_cases:escalate',
    'reports:read',
    'reports:export',
    'settings:read',
    'settings:write',
  ],
  manager: [
    'companies:read',
    'users:read',
    'invoices:read',
    'invoices:write',
    'invoices:send',
    'payments:read',
    'payments:write',
    'payments:process',
    'debt_cases:read',
    'debt_cases:write',
    'debt_cases:assign',
    'reports:read',
    'reports:export',
    'settings:read',
  ],
  user: [
    'companies:read',
    'invoices:read',
    'invoices:write',
    'invoices:send',
    'payments:read',
    'payments:write',
    'debt_cases:read',
    'debt_cases:write',
    'reports:read',
  ],
  readonly: [
    'companies:read',
    'invoices:read',
    'payments:read',
    'debt_cases:read',
    'reports:read',
  ],
};

/** Check if a role has a specific permission */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

// =============================================================================
// CORE ENTITIES
// =============================================================================

/** Base interface for all entities with timestamps */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Base interface for entities with soft delete */
export interface SoftDeletable {
  deletedAt: Date | null;
}

/** Company entity - tenant in multi-tenant architecture */
export interface Company extends BaseEntity, SoftDeletable {
  name: string;
  taxId: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  email: string;
  phone: string | null;
  website: string | null;
  logoUrl: string | null;
  currency: Currency;
  settings: CompanySettings;
}

/** Company-specific settings */
export interface CompanySettings {
  invoicePrefix: string;
  invoiceNextNumber: number;
  paymentTermsDays: number;
  reminderEnabled: boolean;
  reminderDays: number[];
  overdueGraceDays: number;
  defaultCurrency: Currency;
}

/** User entity - authenticated user */
export interface User extends BaseEntity, SoftDeletable {
  email: string;
  name: string;
  role: UserRole;
  companyId: string;
  avatarUrl: string | null;
  phone: string | null;
  lastLoginAt: Date | null;
  isActive: boolean;
}

/** User with company relation loaded */
export interface UserWithCompany extends User {
  company: Company;
}

/** Invoice entity - core billing document */
export interface Invoice extends BaseEntity, SoftDeletable {
  number: string;
  companyId: string;
  customerId: string;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  currency: Currency;
  notes: string | null;
  termsAndConditions: string | null;
  sentAt: Date | null;
  paidAt: Date | null;
}

/** Invoice with relations loaded */
export interface InvoiceWithRelations extends Invoice {
  company: Company;
  customer: Customer;
  items: InvoiceItem[];
  payments: Payment[];
}

/** Invoice line item */
export interface InvoiceItem extends BaseEntity {
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
  sortOrder: number;
}

/** Customer entity - invoice recipient */
export interface Customer extends BaseEntity, SoftDeletable {
  companyId: string;
  name: string;
  email: string;
  taxId: string | null;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string | null;
  contactPerson: string | null;
  notes: string | null;
}

/** Payment entity - payment record */
export interface Payment extends BaseEntity {
  invoiceId: string;
  amount: number;
  currency: Currency;
  method: PaymentMethod;
  status: PaymentStatus;
  reference: string | null;
  transactionId: string | null;
  processedAt: Date | null;
  failedAt: Date | null;
  failureReason: string | null;
  notes: string | null;
}

/** Payment with invoice relation loaded */
export interface PaymentWithInvoice extends Payment {
  invoice: Invoice;
}

/** Debt case entity - debt recovery workflow */
export interface DebtCase extends BaseEntity, SoftDeletable {
  invoiceId: string;
  companyId: string;
  status: DebtCaseStatus;
  priority: DebtCasePriority;
  assignedToId: string | null;
  totalDebt: number;
  currency: Currency;
  lastContactAt: Date | null;
  nextActionAt: Date | null;
  nextAction: string | null;
  escalatedAt: Date | null;
  resolvedAt: Date | null;
  notes: string | null;
}

/** Debt case with relations loaded */
export interface DebtCaseWithRelations extends DebtCase {
  invoice: InvoiceWithRelations;
  assignedTo: User | null;
  activities: DebtCaseActivity[];
}

/** Debt case activity/note */
export interface DebtCaseActivity extends BaseEntity {
  debtCaseId: string;
  userId: string;
  action: string;
  notes: string | null;
  contactMethod: string | null;
  outcome: string | null;
}

/** Activity log entry for auditing */
export interface Activity extends BaseEntity {
  entityType: EntityType;
  entityId: string;
  action: ActivityAction;
  userId: string;
  companyId: string;
  changes: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
}

// =============================================================================
// API TYPES
// =============================================================================

/** Standard API response wrapper */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: Record<string, unknown>;
}

/** API error structure */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  validationErrors?: ValidationError[];
}

/** Field-level validation error */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/** Cursor-based pagination info */
export interface CursorPagination {
  cursor: string | null;
  hasMore: boolean;
  totalCount?: number;
}

/** Paginated response with cursor-based pagination */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: CursorPagination;
}

/** Offset-based pagination info (for compatibility) */
export interface OffsetPagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

/** Paginated response with offset-based pagination */
export interface OffsetPaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: OffsetPagination;
}

// =============================================================================
// INPUT TYPES (for create/update operations)
// =============================================================================

/** Input for creating a company */
export interface CreateCompanyInput {
  name: string;
  taxId: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  email: string;
  phone?: string;
  website?: string;
  currency?: Currency;
}

/** Input for updating a company */
export interface UpdateCompanyInput extends Partial<CreateCompanyInput> {
  settings?: Partial<CompanySettings>;
}

/** Input for creating a user */
export interface CreateUserInput {
  email: string;
  name: string;
  role: UserRole;
  companyId: string;
  phone?: string;
}

/** Input for updating a user */
export interface UpdateUserInput extends Partial<Omit<CreateUserInput, 'companyId'>> {
  isActive?: boolean;
}

/** Input for creating a customer */
export interface CreateCustomerInput {
  companyId: string;
  name: string;
  email: string;
  taxId?: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone?: string;
  contactPerson?: string;
  notes?: string;
}

/** Input for updating a customer */
export interface UpdateCustomerInput extends Partial<Omit<CreateCustomerInput, 'companyId'>> {}

/** Input for creating an invoice */
export interface CreateInvoiceInput {
  companyId: string;
  customerId: string;
  issueDate: Date;
  dueDate: Date;
  currency?: Currency;
  notes?: string;
  termsAndConditions?: string;
  items: CreateInvoiceItemInput[];
}

/** Input for updating an invoice */
export interface UpdateInvoiceInput extends Partial<Omit<CreateInvoiceInput, 'companyId'>> {
  status?: InvoiceStatus;
}

/** Input for creating an invoice item */
export interface CreateInvoiceItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
}

/** Input for creating a payment */
export interface CreatePaymentInput {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
}

/** Input for updating a payment */
export interface UpdatePaymentInput {
  status?: PaymentStatus;
  transactionId?: string;
  notes?: string;
}

/** Input for creating a debt case */
export interface CreateDebtCaseInput {
  invoiceId: string;
  priority?: DebtCasePriority;
  assignedToId?: string;
  notes?: string;
}

/** Input for updating a debt case */
export interface UpdateDebtCaseInput {
  status?: DebtCaseStatus;
  priority?: DebtCasePriority;
  assignedToId?: string;
  nextActionAt?: Date;
  nextAction?: string;
  notes?: string;
}

/** Input for creating a debt case activity */
export interface CreateDebtCaseActivityInput {
  debtCaseId: string;
  action: string;
  notes?: string;
  contactMethod?: string;
  outcome?: string;
}

// =============================================================================
// QUERY/FILTER TYPES
// =============================================================================

/** Base filter options */
export interface BaseFilterOptions {
  cursor?: string;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/** Invoice filter options */
export interface InvoiceFilterOptions extends BaseFilterOptions {
  status?: InvoiceStatus | InvoiceStatus[];
  customerId?: string;
  companyId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

/** Payment filter options */
export interface PaymentFilterOptions extends BaseFilterOptions {
  status?: PaymentStatus | PaymentStatus[];
  invoiceId?: string;
  method?: PaymentMethod;
  dateFrom?: Date;
  dateTo?: Date;
}

/** Debt case filter options */
export interface DebtCaseFilterOptions extends BaseFilterOptions {
  status?: DebtCaseStatus | DebtCaseStatus[];
  priority?: DebtCasePriority | DebtCasePriority[];
  assignedToId?: string;
  companyId?: string;
  minDebt?: number;
  maxDebt?: number;
}

// =============================================================================
// DASHBOARD/STATISTICS TYPES
// =============================================================================

/** Dashboard overview statistics */
export interface DashboardStats {
  totalInvoices: number;
  totalRevenue: number;
  outstandingAmount: number;
  overdueAmount: number;
  invoicesByStatus: Record<InvoiceStatus, number>;
  paymentsByMethod: Record<PaymentMethod, number>;
  recentActivity: Activity[];
}

/** Invoice summary for reports */
export interface InvoiceSummary {
  period: string;
  count: number;
  total: number;
  paid: number;
  outstanding: number;
}

/** Debt case summary for reports */
export interface DebtCaseSummary {
  totalCases: number;
  totalDebt: number;
  byStatus: Record<DebtCaseStatus, number>;
  byPriority: Record<DebtCasePriority, number>;
  recoveryRate: number;
}

// =============================================================================
// AUTH TYPES
// =============================================================================

/** Session user info */
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId: string;
  permissions: Permission[];
}

/** Auth token payload */
export interface TokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  companyId: string;
  iat: number;
  exp: number;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/** Make specific properties optional */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** Make specific properties required */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/** Extract entity without timestamps */
export type WithoutTimestamps<T> = Omit<T, 'createdAt' | 'updatedAt'>;

/** Extract entity without ID */
export type WithoutId<T> = Omit<T, 'id'>;

/** New entity input (without id and timestamps) */
export type NewEntity<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
