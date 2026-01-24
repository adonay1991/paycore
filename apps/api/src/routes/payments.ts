/**
 * Payment Routes
 *
 * CRUD operations for payments.
 * Following patterns from docs/DATA_ARCHITECTURE.md#api-design-patterns
 */

import { Hono } from 'hono';
import { and, desc, eq, gte, isNull, lte, sql } from 'drizzle-orm';
import { db, invoices, payments } from '../db';
import {
  requireAuth,
  requirePermission,
  validateBody,
  validateQuery,
  validateParams,
  idParamSchema,
  NotFoundError,
  BadRequestError,
} from '../middleware';
import {
  createPaymentSchema,
  updatePaymentSchema,
  paymentFilterSchema,
  type CreatePaymentInput,
  type UpdatePaymentInput,
  type PaymentFilterInput,
} from '../validators';
import type { ApiResponse, PaginatedResponse } from '@paycore/types';

// =============================================================================
// ROUTER
// =============================================================================

const paymentsRouter = new Hono();

// All routes require authentication
paymentsRouter.use('*', requireAuth);

// =============================================================================
// LIST PAYMENTS
// =============================================================================

paymentsRouter.get(
  '/',
  requirePermission('payments:read'),
  validateQuery(paymentFilterSchema),
  async (c) => {
    const companyId = c.get('companyId');
    const filters = c.get('validatedQuery') as PaymentFilterInput;

    // Build query conditions - payments are filtered by invoice's company
    const conditions = [isNull(invoices.deletedAt)];

    if (filters.status) {
      const statuses = Array.isArray(filters.status)
        ? filters.status
        : [filters.status];
      conditions.push(sql`${payments.status} = ANY(${statuses})`);
    }

    if (filters.invoiceId) {
      conditions.push(eq(payments.invoiceId, filters.invoiceId));
    }

    if (filters.method) {
      conditions.push(eq(payments.method, filters.method));
    }

    if (filters.dateFrom) {
      conditions.push(gte(payments.createdAt, filters.dateFrom));
    }

    if (filters.dateTo) {
      conditions.push(lte(payments.createdAt, filters.dateTo));
    }

    if (filters.cursor) {
      conditions.push(sql`${payments.id} < ${filters.cursor}`);
    }

    // Execute query with join to filter by company
    const results = await db
      .select({
        id: payments.id,
        invoiceId: payments.invoiceId,
        amount: payments.amount,
        currency: payments.currency,
        method: payments.method,
        status: payments.status,
        reference: payments.reference,
        transactionId: payments.transactionId,
        processedAt: payments.processedAt,
        failedAt: payments.failedAt,
        failureReason: payments.failureReason,
        notes: payments.notes,
        createdAt: payments.createdAt,
        updatedAt: payments.updatedAt,
      })
      .from(payments)
      .innerJoin(invoices, eq(payments.invoiceId, invoices.id))
      .where(and(eq(invoices.companyId, companyId), ...conditions))
      .orderBy(desc(payments.createdAt))
      .limit(filters.limit + 1);

    // Check for more results
    const hasMore = results.length > filters.limit;
    const data = hasMore ? results.slice(0, -1) : results;
    const nextCursor = hasMore ? data[data.length - 1]?.id : null;

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(payments)
      .innerJoin(invoices, eq(payments.invoiceId, invoices.id))
      .where(and(eq(invoices.companyId, companyId), isNull(invoices.deletedAt)));

    const response: PaginatedResponse<(typeof data)[0]> = {
      success: true,
      data,
      pagination: {
        cursor: nextCursor,
        hasMore,
        totalCount: countResult?.count,
      },
    };

    return c.json(response);
  }
);

// =============================================================================
// GET PAYMENT BY ID
// =============================================================================

paymentsRouter.get(
  '/:id',
  requirePermission('payments:read'),
  validateParams(idParamSchema),
  async (c) => {
    const companyId = c.get('companyId');
    const { id } = c.get('validatedParams') as { id: string };

    // Fetch payment with invoice to verify company ownership
    const result = await db
      .select()
      .from(payments)
      .innerJoin(invoices, eq(payments.invoiceId, invoices.id))
      .where(
        and(
          eq(payments.id, id),
          eq(invoices.companyId, companyId),
          isNull(invoices.deletedAt)
        )
      )
      .limit(1);

    if (result.length === 0) {
      throw new NotFoundError('Payment', id);
    }

    const payment = result[0].payments;

    const response: ApiResponse<typeof payment> = {
      success: true,
      data: payment,
    };

    return c.json(response);
  }
);

// =============================================================================
// CREATE PAYMENT
// =============================================================================

paymentsRouter.post(
  '/',
  requirePermission('payments:write'),
  validateBody(createPaymentSchema),
  async (c) => {
    const companyId = c.get('companyId');
    const input = c.get('validatedBody') as CreatePaymentInput;

    // Verify invoice exists and belongs to company
    const invoice = await db.query.invoices.findFirst({
      where: and(
        eq(invoices.id, input.invoiceId),
        eq(invoices.companyId, companyId),
        isNull(invoices.deletedAt)
      ),
    });

    if (!invoice) {
      throw new NotFoundError('Invoice', input.invoiceId);
    }

    // Check if payment amount is valid
    const remainingBalance =
      Number(invoice.total) - Number(invoice.paidAmount);
    if (input.amount > remainingBalance) {
      throw new BadRequestError(
        `Payment amount (${input.amount}) exceeds remaining balance (${remainingBalance})`
      );
    }

    // Create payment and update invoice in transaction
    const result = await db.transaction(async (tx) => {
      // Insert payment
      const [payment] = await tx
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
    });

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
    };

    return c.json(response, 201);
  }
);

// =============================================================================
// UPDATE PAYMENT
// =============================================================================

paymentsRouter.put(
  '/:id',
  requirePermission('payments:write'),
  validateParams(idParamSchema),
  validateBody(updatePaymentSchema),
  async (c) => {
    const companyId = c.get('companyId');
    const { id } = c.get('validatedParams') as { id: string };
    const input = c.get('validatedBody') as UpdatePaymentInput;

    // Verify payment exists and belongs to company
    const existingResult = await db
      .select()
      .from(payments)
      .innerJoin(invoices, eq(payments.invoiceId, invoices.id))
      .where(
        and(
          eq(payments.id, id),
          eq(invoices.companyId, companyId),
          isNull(invoices.deletedAt)
        )
      )
      .limit(1);

    if (existingResult.length === 0) {
      throw new NotFoundError('Payment', id);
    }

    const existing = existingResult[0].payments;
    const invoice = existingResult[0].invoices;

    // Don't allow modifying completed/refunded payments
    if (['completed', 'refunded'].includes(existing.status)) {
      throw new BadRequestError(
        `Cannot modify payment with status: ${existing.status}`
      );
    }

    // Update payment and potentially invoice in transaction
    const result = await db.transaction(async (tx) => {
      // Build update object
      const updates: Partial<typeof payments.$inferInsert> = {
        updatedAt: new Date(),
      };

      if (input.status) updates.status = input.status;
      if (input.transactionId !== undefined)
        updates.transactionId = input.transactionId;
      if (input.notes !== undefined) updates.notes = input.notes;

      // Handle status transitions
      if (input.status === 'completed' && existing.status !== 'completed') {
        updates.processedAt = new Date();

        // Update invoice paid amount and status
        const newPaidAmount =
          Number(invoice.paidAmount) + Number(existing.amount);
        const invoiceTotal = Number(invoice.total);

        let newStatus: 'paid' | 'partial' = 'partial';
        if (newPaidAmount >= invoiceTotal) {
          newStatus = 'paid';
        }

        await tx
          .update(invoices)
          .set({
            paidAmount: String(newPaidAmount),
            status: newStatus,
            paidAt: newStatus === 'paid' ? new Date() : null,
            updatedAt: new Date(),
          })
          .where(eq(invoices.id, invoice.id));
      }

      if (input.status === 'failed') {
        updates.failedAt = new Date();
      }

      // Update payment
      const [payment] = await tx
        .update(payments)
        .set(updates)
        .where(eq(payments.id, id))
        .returning();

      return payment;
    });

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
    };

    return c.json(response);
  }
);

// =============================================================================
// PROCESS PAYMENT (mark as completed)
// =============================================================================

paymentsRouter.post(
  '/:id/process',
  requirePermission('payments:process'),
  validateParams(idParamSchema),
  async (c) => {
    const companyId = c.get('companyId');
    const { id } = c.get('validatedParams') as { id: string };

    // Verify payment exists and belongs to company
    const existingResult = await db
      .select()
      .from(payments)
      .innerJoin(invoices, eq(payments.invoiceId, invoices.id))
      .where(
        and(
          eq(payments.id, id),
          eq(invoices.companyId, companyId),
          isNull(invoices.deletedAt)
        )
      )
      .limit(1);

    if (existingResult.length === 0) {
      throw new NotFoundError('Payment', id);
    }

    const existing = existingResult[0].payments;
    const invoice = existingResult[0].invoices;

    // Can only process pending payments
    if (existing.status !== 'pending') {
      throw new BadRequestError(
        `Can only process pending payments. Current status: ${existing.status}`
      );
    }

    // Process payment in transaction
    const result = await db.transaction(async (tx) => {
      // Update payment status
      const [payment] = await tx
        .update(payments)
        .set({
          status: 'completed',
          processedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(payments.id, id))
        .returning();

      // Update invoice paid amount and status
      const newPaidAmount =
        Number(invoice.paidAmount) + Number(existing.amount);
      const invoiceTotal = Number(invoice.total);

      let newStatus: 'paid' | 'partial' = 'partial';
      if (newPaidAmount >= invoiceTotal) {
        newStatus = 'paid';
      }

      await tx
        .update(invoices)
        .set({
          paidAmount: String(newPaidAmount),
          status: newStatus,
          paidAt: newStatus === 'paid' ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, invoice.id));

      return payment;
    });

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
    };

    return c.json(response);
  }
);

// =============================================================================
// REFUND PAYMENT
// =============================================================================

paymentsRouter.post(
  '/:id/refund',
  requirePermission('payments:refund'),
  validateParams(idParamSchema),
  async (c) => {
    const companyId = c.get('companyId');
    const { id } = c.get('validatedParams') as { id: string };

    // Verify payment exists and belongs to company
    const existingResult = await db
      .select()
      .from(payments)
      .innerJoin(invoices, eq(payments.invoiceId, invoices.id))
      .where(
        and(
          eq(payments.id, id),
          eq(invoices.companyId, companyId),
          isNull(invoices.deletedAt)
        )
      )
      .limit(1);

    if (existingResult.length === 0) {
      throw new NotFoundError('Payment', id);
    }

    const existing = existingResult[0].payments;
    const invoice = existingResult[0].invoices;

    // Can only refund completed payments
    if (existing.status !== 'completed') {
      throw new BadRequestError(
        `Can only refund completed payments. Current status: ${existing.status}`
      );
    }

    // Process refund in transaction
    const result = await db.transaction(async (tx) => {
      // Update payment status
      const [payment] = await tx
        .update(payments)
        .set({
          status: 'refunded',
          updatedAt: new Date(),
        })
        .where(eq(payments.id, id))
        .returning();

      // Update invoice paid amount and status
      const newPaidAmount =
        Number(invoice.paidAmount) - Number(existing.amount);

      let newStatus: 'sent' | 'partial' = 'sent';
      if (newPaidAmount > 0) {
        newStatus = 'partial';
      }

      await tx
        .update(invoices)
        .set({
          paidAmount: String(Math.max(0, newPaidAmount)),
          status: newStatus,
          paidAt: null,
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, invoice.id));

      return payment;
    });

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
    };

    return c.json(response);
  }
);

export default paymentsRouter;
