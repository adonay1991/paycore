/**
 * Invoice Service
 *
 * Business logic for invoice management.
 * Following patterns from docs/DATA_ARCHITECTURE.md
 */

import { and, eq, isNull, lt, sql } from 'drizzle-orm';
import { db, invoices, invoiceItems, companies, customers } from '../db';
import type { InvoiceRow, InvoiceItemRow, CustomerRow, CompanyRow } from '../db';

// =============================================================================
// TYPES
// =============================================================================

export interface InvoiceItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
}

export interface CalculatedInvoiceItem extends InvoiceItemInput {
  subtotal: number;
  taxAmount: number;
  total: number;
  sortOrder: number;
}

export interface InvoiceTotals {
  subtotal: number;
  taxAmount: number;
  total: number;
}

export interface InvoiceWithDetails extends InvoiceRow {
  customer: CustomerRow;
  items: InvoiceItemRow[];
  company?: CompanyRow;
}

// =============================================================================
// INVOICE CALCULATIONS
// =============================================================================

/**
 * Calculate totals for invoice items.
 */
export function calculateInvoiceItems(
  items: InvoiceItemInput[],
  defaultTaxRate = 21
): CalculatedInvoiceItem[] {
  return items.map((item, index) => {
    const taxRate = item.taxRate ?? defaultTaxRate;
    const subtotal = item.quantity * item.unitPrice;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    return {
      ...item,
      taxRate,
      subtotal,
      taxAmount,
      total,
      sortOrder: index,
    };
  });
}

/**
 * Calculate invoice totals from items.
 */
export function calculateInvoiceTotals(
  items: CalculatedInvoiceItem[]
): InvoiceTotals {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const taxAmount = items.reduce((sum, item) => sum + item.taxAmount, 0);
  const total = subtotal + taxAmount;

  return { subtotal, taxAmount, total };
}

// =============================================================================
// INVOICE NUMBER GENERATION
// =============================================================================

/**
 * Generate next invoice number for a company.
 */
export async function generateInvoiceNumber(
  companyId: string
): Promise<string> {
  // Get company settings
  const company = await db.query.companies.findFirst({
    where: eq(companies.id, companyId),
  });

  if (!company) {
    throw new Error(`Company ${companyId} not found`);
  }

  const settings = company.settings;

  const prefix = settings.invoicePrefix || 'INV';
  const nextNumber = settings.invoiceNextNumber || 1;

  // Format: INV-000001
  const invoiceNumber = `${prefix}-${String(nextNumber).padStart(6, '0')}`;

  // Update next number in company settings
  await db
    .update(companies)
    .set({
      settings: {
        ...settings,
        invoiceNextNumber: nextNumber + 1,
      },
      updatedAt: new Date(),
    })
    .where(eq(companies.id, companyId));

  return invoiceNumber;
}

// =============================================================================
// INVOICE STATUS MANAGEMENT
// =============================================================================

/**
 * Get invoices that are overdue.
 */
export async function getOverdueInvoices(
  companyId: string,
  graceDays = 0
): Promise<InvoiceRow[]> {
  const gracePeriodDate = new Date();
  gracePeriodDate.setDate(gracePeriodDate.getDate() - graceDays);

  return db.query.invoices.findMany({
    where: and(
      eq(invoices.companyId, companyId),
      eq(invoices.status, 'sent'),
      lt(invoices.dueDate, gracePeriodDate),
      isNull(invoices.deletedAt)
    ),
  });
}

/**
 * Mark invoices as overdue.
 */
export async function markInvoicesOverdue(
  companyId: string,
  graceDays = 0
): Promise<number> {
  const overdueInvoices = await getOverdueInvoices(companyId, graceDays);

  if (overdueInvoices.length === 0) {
    return 0;
  }

  const invoiceIds = overdueInvoices.map((inv) => inv.id);

  await db
    .update(invoices)
    .set({
      status: 'overdue',
      updatedAt: new Date(),
    })
    .where(sql`${invoices.id} = ANY(${invoiceIds})`);

  return overdueInvoices.length;
}

/**
 * Update invoice payment status based on paid amount.
 */
export async function updateInvoicePaymentStatus(
  invoiceId: string
): Promise<InvoiceRow> {
  const invoice = await db.query.invoices.findFirst({
    where: eq(invoices.id, invoiceId),
  });

  if (!invoice) {
    throw new Error(`Invoice ${invoiceId} not found`);
  }

  const total = Number(invoice.total);
  const paidAmount = Number(invoice.paidAmount);

  let newStatus = invoice.status;

  if (paidAmount >= total) {
    newStatus = 'paid';
  } else if (paidAmount > 0) {
    newStatus = 'partial';
  }

  if (newStatus !== invoice.status) {
    const [updated] = await db
      .update(invoices)
      .set({
        status: newStatus,
        paidAt: newStatus === 'paid' ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoiceId))
      .returning();

    return updated;
  }

  return invoice;
}

// =============================================================================
// INVOICE RETRIEVAL
// =============================================================================

/**
 * Get full invoice with all details.
 */
export async function getInvoiceWithDetails(
  invoiceId: string,
  companyId: string
): Promise<InvoiceWithDetails | null> {
  const invoice = await db.query.invoices.findFirst({
    where: and(
      eq(invoices.id, invoiceId),
      eq(invoices.companyId, companyId),
      isNull(invoices.deletedAt)
    ),
    with: {
      customer: true,
      items: {
        orderBy: (items, { asc }) => [asc(items.sortOrder)],
      },
      company: true,
    },
  });

  return invoice as InvoiceWithDetails | null;
}

/**
 * Get invoices requiring reminder.
 * Returns invoices that are sent but not paid, where the due date is approaching.
 */
export async function getInvoicesForReminder(
  companyId: string,
  daysBeforeDue: number
): Promise<InvoiceRow[]> {
  const reminderDate = new Date();
  reminderDate.setDate(reminderDate.getDate() + daysBeforeDue);

  return db.query.invoices.findMany({
    where: and(
      eq(invoices.companyId, companyId),
      eq(invoices.status, 'sent'),
      lt(invoices.dueDate, reminderDate),
      isNull(invoices.deletedAt)
    ),
  });
}

// =============================================================================
// INVOICE STATISTICS
// =============================================================================

export interface InvoiceStatistics {
  totalInvoices: number;
  draftCount: number;
  sentCount: number;
  paidCount: number;
  overdueCount: number;
  totalRevenue: number;
  totalOutstanding: number;
  totalOverdue: number;
}

/**
 * Get invoice statistics for a company.
 */
export async function getInvoiceStatistics(
  companyId: string
): Promise<InvoiceStatistics> {
  const results = await db
    .select({
      status: invoices.status,
      count: sql<number>`count(*)`,
      total: sql<number>`sum(${invoices.total}::numeric)`,
      paidAmount: sql<number>`sum(${invoices.paidAmount}::numeric)`,
    })
    .from(invoices)
    .where(and(eq(invoices.companyId, companyId), isNull(invoices.deletedAt)))
    .groupBy(invoices.status);

  const stats: InvoiceStatistics = {
    totalInvoices: 0,
    draftCount: 0,
    sentCount: 0,
    paidCount: 0,
    overdueCount: 0,
    totalRevenue: 0,
    totalOutstanding: 0,
    totalOverdue: 0,
  };

  for (const row of results) {
    const count = Number(row.count);
    const total = Number(row.total) || 0;
    const paidAmount = Number(row.paidAmount) || 0;

    stats.totalInvoices += count;

    switch (row.status) {
      case 'draft':
        stats.draftCount = count;
        break;
      case 'sent':
      case 'partial':
        stats.sentCount += count;
        stats.totalOutstanding += total - paidAmount;
        break;
      case 'paid':
        stats.paidCount = count;
        stats.totalRevenue += paidAmount;
        break;
      case 'overdue':
        stats.overdueCount = count;
        stats.totalOverdue += total - paidAmount;
        stats.totalOutstanding += total - paidAmount;
        break;
    }
  }

  return stats;
}

export default {
  calculateInvoiceItems,
  calculateInvoiceTotals,
  generateInvoiceNumber,
  getOverdueInvoices,
  markInvoicesOverdue,
  updateInvoicePaymentStatus,
  getInvoiceWithDetails,
  getInvoicesForReminder,
  getInvoiceStatistics,
};
