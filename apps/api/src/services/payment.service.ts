/**
 * Payment Service
 *
 * Business logic for payment processing and reconciliation.
 * Following patterns from docs/DATA_ARCHITECTURE.md
 */

import { and, eq, isNull, sql, gte, lte } from 'drizzle-orm';
import { db, payments, invoices } from '../db';
import type { PaymentRow, InvoiceRow } from '../db';
import type { PaymentMethod, PaymentStatus, Currency } from '@paycore/types';

// =============================================================================
// TYPES
// =============================================================================

export interface PaymentInput {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string | null;
  notes?: string | null;
}

export interface ProcessPaymentResult {
  payment: PaymentRow;
  invoice: InvoiceRow;
  fullyPaid: boolean;
}

export interface PaymentStatistics {
  totalPayments: number;
  completedCount: number;
  pendingCount: number;
  failedCount: number;
  refundedCount: number;
  totalReceived: number;
  totalPending: number;
  totalRefunded: number;
  byMethod: Record<PaymentMethod, number>;
}

// =============================================================================
// PAYMENT CREATION
// =============================================================================

/**
 * Create a new payment record.
 */
export async function createPayment(
  input: PaymentInput,
  companyId: string
): Promise<PaymentRow> {
  // Verify invoice exists and belongs to company
  const invoice = await db.query.invoices.findFirst({
    where: and(
      eq(invoices.id, input.invoiceId),
      eq(invoices.companyId, companyId),
      isNull(invoices.deletedAt)
    ),
  });

  if (!invoice) {
    throw new Error(`Invoice ${input.invoiceId} not found`);
  }

  // Check remaining balance
  const remainingBalance = Number(invoice.total) - Number(invoice.paidAmount);
  if (input.amount > remainingBalance) {
    throw new Error(
      `Payment amount (${input.amount}) exceeds remaining balance (${remainingBalance})`
    );
  }

  // Create payment
  const [payment] = await db
    .insert(payments)
    .values({
      invoiceId: input.invoiceId,
      amount: String(input.amount),
      currency: invoice.currency,
      method: input.method,
      status: 'pending',
      reference: input.reference,
      notes: input.notes,
    })
    .returning();

  return payment;
}

// =============================================================================
// PAYMENT PROCESSING
// =============================================================================

/**
 * Process a pending payment (mark as completed).
 */
export async function processPayment(
  paymentId: string,
  companyId: string,
  transactionId?: string
): Promise<ProcessPaymentResult> {
  // Get payment with invoice
  const paymentResult = await db
    .select()
    .from(payments)
    .innerJoin(invoices, eq(payments.invoiceId, invoices.id))
    .where(
      and(
        eq(payments.id, paymentId),
        eq(invoices.companyId, companyId),
        isNull(invoices.deletedAt)
      )
    )
    .limit(1);

  if (paymentResult.length === 0) {
    throw new Error(`Payment ${paymentId} not found`);
  }

  const existingPayment = paymentResult[0].payments;
  const invoice = paymentResult[0].invoices;

  if (existingPayment.status !== 'pending') {
    throw new Error(
      `Can only process pending payments. Current status: ${existingPayment.status}`
    );
  }

  // Process in transaction
  const result = await db.transaction(async (tx) => {
    // Update payment
    const [updatedPayment] = await tx
      .update(payments)
      .set({
        status: 'completed',
        transactionId,
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payments.id, paymentId))
      .returning();

    // Update invoice
    const newPaidAmount =
      Number(invoice.paidAmount) + Number(existingPayment.amount);
    const invoiceTotal = Number(invoice.total);
    const fullyPaid = newPaidAmount >= invoiceTotal;

    const [updatedInvoice] = await tx
      .update(invoices)
      .set({
        paidAmount: String(newPaidAmount),
        status: fullyPaid ? 'paid' : 'partial',
        paidAt: fullyPaid ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoice.id))
      .returning();

    return {
      payment: updatedPayment,
      invoice: updatedInvoice,
      fullyPaid,
    };
  });

  return result;
}

/**
 * Mark a payment as failed.
 */
export async function failPayment(
  paymentId: string,
  companyId: string,
  reason: string
): Promise<PaymentRow> {
  // Verify payment exists and belongs to company
  const paymentResult = await db
    .select()
    .from(payments)
    .innerJoin(invoices, eq(payments.invoiceId, invoices.id))
    .where(
      and(
        eq(payments.id, paymentId),
        eq(invoices.companyId, companyId),
        isNull(invoices.deletedAt)
      )
    )
    .limit(1);

  if (paymentResult.length === 0) {
    throw new Error(`Payment ${paymentId} not found`);
  }

  const existingPayment = paymentResult[0].payments;

  if (existingPayment.status !== 'pending') {
    throw new Error(
      `Can only fail pending payments. Current status: ${existingPayment.status}`
    );
  }

  const [updated] = await db
    .update(payments)
    .set({
      status: 'failed',
      failedAt: new Date(),
      failureReason: reason,
      updatedAt: new Date(),
    })
    .where(eq(payments.id, paymentId))
    .returning();

  return updated;
}

// =============================================================================
// REFUNDS
// =============================================================================

/**
 * Refund a completed payment.
 */
export async function refundPayment(
  paymentId: string,
  companyId: string
): Promise<ProcessPaymentResult> {
  // Get payment with invoice
  const paymentResult = await db
    .select()
    .from(payments)
    .innerJoin(invoices, eq(payments.invoiceId, invoices.id))
    .where(
      and(
        eq(payments.id, paymentId),
        eq(invoices.companyId, companyId),
        isNull(invoices.deletedAt)
      )
    )
    .limit(1);

  if (paymentResult.length === 0) {
    throw new Error(`Payment ${paymentId} not found`);
  }

  const existingPayment = paymentResult[0].payments;
  const invoice = paymentResult[0].invoices;

  if (existingPayment.status !== 'completed') {
    throw new Error(
      `Can only refund completed payments. Current status: ${existingPayment.status}`
    );
  }

  // Process refund in transaction
  const result = await db.transaction(async (tx) => {
    // Update payment
    const [updatedPayment] = await tx
      .update(payments)
      .set({
        status: 'refunded',
        updatedAt: new Date(),
      })
      .where(eq(payments.id, paymentId))
      .returning();

    // Update invoice
    const newPaidAmount = Math.max(
      0,
      Number(invoice.paidAmount) - Number(existingPayment.amount)
    );

    const [updatedInvoice] = await tx
      .update(invoices)
      .set({
        paidAmount: String(newPaidAmount),
        status: newPaidAmount > 0 ? 'partial' : 'sent',
        paidAt: null,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoice.id))
      .returning();

    return {
      payment: updatedPayment,
      invoice: updatedInvoice,
      fullyPaid: false,
    };
  });

  return result;
}

// =============================================================================
// RECONCILIATION
// =============================================================================

/**
 * Reconcile payments for an invoice.
 * Recalculates the paid amount based on all completed payments.
 */
export async function reconcileInvoicePayments(
  invoiceId: string
): Promise<InvoiceRow> {
  // Get all completed payments for invoice
  const invoicePayments = await db.query.payments.findMany({
    where: and(
      eq(payments.invoiceId, invoiceId),
      eq(payments.status, 'completed')
    ),
  });

  // Calculate total paid
  const totalPaid = invoicePayments.reduce(
    (sum, p) => sum + Number(p.amount),
    0
  );

  // Get invoice
  const invoice = await db.query.invoices.findFirst({
    where: eq(invoices.id, invoiceId),
  });

  if (!invoice) {
    throw new Error(`Invoice ${invoiceId} not found`);
  }

  const invoiceTotal = Number(invoice.total);
  const fullyPaid = totalPaid >= invoiceTotal;

  // Update invoice
  const [updated] = await db
    .update(invoices)
    .set({
      paidAmount: String(totalPaid),
      status: fullyPaid ? 'paid' : totalPaid > 0 ? 'partial' : invoice.status,
      paidAt: fullyPaid ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, invoiceId))
    .returning();

  return updated;
}

// =============================================================================
// PAYMENT STATISTICS
// =============================================================================

/**
 * Get payment statistics for a company.
 */
export async function getPaymentStatistics(
  companyId: string,
  dateFrom?: Date,
  dateTo?: Date
): Promise<PaymentStatistics> {
  const conditions = [
    eq(invoices.companyId, companyId),
    isNull(invoices.deletedAt),
  ];

  if (dateFrom) {
    conditions.push(gte(payments.createdAt, dateFrom));
  }
  if (dateTo) {
    conditions.push(lte(payments.createdAt, dateTo));
  }

  // Get counts and totals by status
  const statusResults = await db
    .select({
      status: payments.status,
      count: sql<number>`count(*)`,
      total: sql<number>`sum(${payments.amount}::numeric)`,
    })
    .from(payments)
    .innerJoin(invoices, eq(payments.invoiceId, invoices.id))
    .where(and(...conditions))
    .groupBy(payments.status);

  // Get totals by method
  const methodResults = await db
    .select({
      method: payments.method,
      total: sql<number>`sum(${payments.amount}::numeric)`,
    })
    .from(payments)
    .innerJoin(invoices, eq(payments.invoiceId, invoices.id))
    .where(and(...conditions, eq(payments.status, 'completed')))
    .groupBy(payments.method);

  const stats: PaymentStatistics = {
    totalPayments: 0,
    completedCount: 0,
    pendingCount: 0,
    failedCount: 0,
    refundedCount: 0,
    totalReceived: 0,
    totalPending: 0,
    totalRefunded: 0,
    byMethod: {
      bank_transfer: 0,
      card: 0,
      direct_debit: 0,
      cash: 0,
      other: 0,
    },
  };

  for (const row of statusResults) {
    const count = Number(row.count);
    const total = Number(row.total) || 0;

    stats.totalPayments += count;

    switch (row.status) {
      case 'completed':
        stats.completedCount = count;
        stats.totalReceived = total;
        break;
      case 'pending':
        stats.pendingCount = count;
        stats.totalPending = total;
        break;
      case 'failed':
        stats.failedCount = count;
        break;
      case 'refunded':
        stats.refundedCount = count;
        stats.totalRefunded = total;
        break;
    }
  }

  for (const row of methodResults) {
    const method = row.method as PaymentMethod;
    stats.byMethod[method] = Number(row.total) || 0;
  }

  return stats;
}

/**
 * Get payments for a specific invoice.
 */
export async function getPaymentsForInvoice(
  invoiceId: string
): Promise<PaymentRow[]> {
  return db.query.payments.findMany({
    where: eq(payments.invoiceId, invoiceId),
    orderBy: (p, { desc }) => [desc(p.createdAt)],
  });
}

export default {
  createPayment,
  processPayment,
  failPayment,
  refundPayment,
  reconcileInvoicePayments,
  getPaymentStatistics,
  getPaymentsForInvoice,
};
