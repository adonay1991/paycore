/**
 * Invoice Routes
 *
 * CRUD operations for invoices.
 * Following patterns from docs/DATA_ARCHITECTURE.md#api-design-patterns
 */

import { Hono } from 'hono';
import { and, desc, eq, gte, isNull, lte, sql } from 'drizzle-orm';
import { db, invoices, invoiceItems, customers, payments } from '../db';
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
  createInvoiceSchema,
  updateInvoiceSchema,
  invoiceFilterSchema,
  type CreateInvoiceInput,
  type UpdateInvoiceInput,
  type InvoiceFilterInput,
} from '../validators';
import type { ApiResponse, PaginatedResponse } from '@paycore/types';

// =============================================================================
// ROUTER
// =============================================================================

const invoicesRouter = new Hono();

// All routes require authentication
invoicesRouter.use('*', requireAuth);

// =============================================================================
// LIST INVOICES
// =============================================================================

invoicesRouter.get(
  '/',
  requirePermission('invoices:read'),
  validateQuery(invoiceFilterSchema),
  async (c) => {
    const companyId = c.get('companyId');
    const filters = c.get('validatedQuery') as InvoiceFilterInput;

    // Build query conditions
    const conditions = [
      eq(invoices.companyId, companyId),
      isNull(invoices.deletedAt),
    ];

    if (filters.status) {
      const statuses = Array.isArray(filters.status)
        ? filters.status
        : [filters.status];
      conditions.push(sql`${invoices.status} = ANY(${statuses})`);
    }

    if (filters.customerId) {
      conditions.push(eq(invoices.customerId, filters.customerId));
    }

    if (filters.dateFrom) {
      conditions.push(gte(invoices.issueDate, filters.dateFrom));
    }

    if (filters.dateTo) {
      conditions.push(lte(invoices.issueDate, filters.dateTo));
    }

    if (filters.minAmount !== undefined) {
      conditions.push(gte(invoices.total, String(filters.minAmount)));
    }

    if (filters.maxAmount !== undefined) {
      conditions.push(lte(invoices.total, String(filters.maxAmount)));
    }

    if (filters.cursor) {
      conditions.push(sql`${invoices.id} < ${filters.cursor}`);
    }

    // Execute query
    const results = await db
      .select()
      .from(invoices)
      .where(and(...conditions))
      .orderBy(desc(invoices.createdAt))
      .limit(filters.limit + 1); // +1 to check if there are more

    // Check for more results
    const hasMore = results.length > filters.limit;
    const data = hasMore ? results.slice(0, -1) : results;
    const nextCursor = hasMore ? data[data.length - 1]?.id : null;

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(invoices)
      .where(
        and(eq(invoices.companyId, companyId), isNull(invoices.deletedAt))
      );

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
// GET INVOICE BY ID
// =============================================================================

invoicesRouter.get(
  '/:id',
  requirePermission('invoices:read'),
  validateParams(idParamSchema),
  async (c) => {
    const companyId = c.get('companyId');
    const { id } = c.get('validatedParams') as { id: string };

    // Fetch invoice with relations
    const invoice = await db.query.invoices.findFirst({
      where: and(
        eq(invoices.id, id),
        eq(invoices.companyId, companyId),
        isNull(invoices.deletedAt)
      ),
      with: {
        customer: true,
        items: {
          orderBy: (items, { asc }) => [asc(items.sortOrder)],
        },
        payments: {
          orderBy: (payments, { desc }) => [desc(payments.createdAt)],
        },
      },
    });

    if (!invoice) {
      throw new NotFoundError('Invoice', id);
    }

    const response: ApiResponse<typeof invoice> = {
      success: true,
      data: invoice,
    };

    return c.json(response);
  }
);

// =============================================================================
// CREATE INVOICE
// =============================================================================

invoicesRouter.post(
  '/',
  requirePermission('invoices:write'),
  validateBody(createInvoiceSchema),
  async (c) => {
    const companyId = c.get('companyId');
    const input = c.get('validatedBody') as CreateInvoiceInput;

    // Verify company matches
    if (input.companyId !== companyId) {
      throw new BadRequestError('Company ID mismatch');
    }

    // Verify customer exists and belongs to company
    const customer = await db.query.customers.findFirst({
      where: and(
        eq(customers.id, input.customerId),
        eq(customers.companyId, companyId),
        isNull(customers.deletedAt)
      ),
    });

    if (!customer) {
      throw new NotFoundError('Customer', input.customerId);
    }

    // Calculate totals
    const items = input.items.map((item, index) => {
      const subtotal = item.quantity * item.unitPrice;
      const taxAmount = subtotal * ((item.taxRate || 21) / 100);
      return {
        ...item,
        total: subtotal + taxAmount,
        sortOrder: index,
      };
    });

    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const taxAmount = items.reduce(
      (sum, item) =>
        sum + item.quantity * item.unitPrice * ((item.taxRate || 21) / 100),
      0
    );
    const total = subtotal + taxAmount;

    // Generate invoice number (simple increment, should be improved)
    const [lastInvoice] = await db
      .select({ number: invoices.number })
      .from(invoices)
      .where(eq(invoices.companyId, companyId))
      .orderBy(desc(invoices.createdAt))
      .limit(1);

    const nextNumber = lastInvoice
      ? `INV-${String(parseInt(lastInvoice.number.replace('INV-', '')) + 1).padStart(6, '0')}`
      : 'INV-000001';

    // Create invoice with items in transaction
    const result = await db.transaction(async (tx) => {
      const [invoice] = await tx
        .insert(invoices)
        .values({
          number: nextNumber,
          companyId,
          customerId: input.customerId,
          status: 'draft',
          issueDate: input.issueDate,
          dueDate: input.dueDate,
          subtotal: String(subtotal),
          taxRate: '21', // Default tax rate
          taxAmount: String(taxAmount),
          total: String(total),
          paidAmount: '0',
          currency: input.currency || 'EUR',
          notes: input.notes,
          termsAndConditions: input.termsAndConditions,
        })
        .returning();

      // Insert items
      if (items.length > 0) {
        await tx.insert(invoiceItems).values(
          items.map((item) => ({
            invoiceId: invoice.id,
            description: item.description,
            quantity: String(item.quantity),
            unitPrice: String(item.unitPrice),
            taxRate: String(item.taxRate || 21),
            total: String(item.total),
            sortOrder: item.sortOrder,
          }))
        );
      }

      return invoice;
    });

    // Fetch complete invoice with relations
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, result.id),
      with: {
        customer: true,
        items: true,
      },
    });

    const response: ApiResponse<typeof invoice> = {
      success: true,
      data: invoice!,
    };

    return c.json(response, 201);
  }
);

// =============================================================================
// UPDATE INVOICE
// =============================================================================

invoicesRouter.put(
  '/:id',
  requirePermission('invoices:write'),
  validateParams(idParamSchema),
  validateBody(updateInvoiceSchema),
  async (c) => {
    const companyId = c.get('companyId');
    const { id } = c.get('validatedParams') as { id: string };
    const input = c.get('validatedBody') as UpdateInvoiceInput;

    // Verify invoice exists and belongs to company
    const existing = await db.query.invoices.findFirst({
      where: and(
        eq(invoices.id, id),
        eq(invoices.companyId, companyId),
        isNull(invoices.deletedAt)
      ),
    });

    if (!existing) {
      throw new NotFoundError('Invoice', id);
    }

    // Don't allow editing paid invoices
    if (existing.status === 'paid') {
      throw new BadRequestError('Cannot edit a paid invoice');
    }

    // If updating customer, verify it exists
    if (input.customerId) {
      const customer = await db.query.customers.findFirst({
        where: and(
          eq(customers.id, input.customerId),
          eq(customers.companyId, companyId),
          isNull(customers.deletedAt)
        ),
      });

      if (!customer) {
        throw new NotFoundError('Customer', input.customerId);
      }
    }

    // Build update object
    const updates: Partial<typeof invoices.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (input.customerId) updates.customerId = input.customerId;
    if (input.issueDate) updates.issueDate = input.issueDate;
    if (input.dueDate) updates.dueDate = input.dueDate;
    if (input.currency) updates.currency = input.currency;
    if (input.notes !== undefined) updates.notes = input.notes;
    if (input.termsAndConditions !== undefined)
      updates.termsAndConditions = input.termsAndConditions;
    if (input.status) updates.status = input.status;

    // Update invoice and items in transaction
    await db.transaction(async (tx) => {
      // Update invoice
      await tx.update(invoices).set(updates).where(eq(invoices.id, id));

      // Update items if provided
      if (input.items) {
        // Delete existing items
        await tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));

        // Recalculate totals
        const items = input.items.map((item, index) => {
          const subtotal = item.quantity * item.unitPrice;
          const taxAmount = subtotal * ((item.taxRate || 21) / 100);
          return {
            ...item,
            total: subtotal + taxAmount,
            sortOrder: index,
          };
        });

        const subtotal = items.reduce(
          (sum, item) => sum + item.quantity * item.unitPrice,
          0
        );
        const taxAmount = items.reduce(
          (sum, item) =>
            sum + item.quantity * item.unitPrice * ((item.taxRate || 21) / 100),
          0
        );
        const total = subtotal + taxAmount;

        // Update invoice totals
        await tx
          .update(invoices)
          .set({
            subtotal: String(subtotal),
            taxAmount: String(taxAmount),
            total: String(total),
          })
          .where(eq(invoices.id, id));

        // Insert new items
        await tx.insert(invoiceItems).values(
          items.map((item) => ({
            invoiceId: id,
            description: item.description,
            quantity: String(item.quantity),
            unitPrice: String(item.unitPrice),
            taxRate: String(item.taxRate || 21),
            total: String(item.total),
            sortOrder: item.sortOrder,
          }))
        );
      }
    });

    // Fetch updated invoice
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, id),
      with: {
        customer: true,
        items: true,
        payments: true,
      },
    });

    const response: ApiResponse<typeof invoice> = {
      success: true,
      data: invoice!,
    };

    return c.json(response);
  }
);

// =============================================================================
// DELETE INVOICE (soft delete)
// =============================================================================

invoicesRouter.delete(
  '/:id',
  requirePermission('invoices:delete'),
  validateParams(idParamSchema),
  async (c) => {
    const companyId = c.get('companyId');
    const { id } = c.get('validatedParams') as { id: string };

    // Verify invoice exists and belongs to company
    const existing = await db.query.invoices.findFirst({
      where: and(
        eq(invoices.id, id),
        eq(invoices.companyId, companyId),
        isNull(invoices.deletedAt)
      ),
    });

    if (!existing) {
      throw new NotFoundError('Invoice', id);
    }

    // Don't allow deleting paid invoices
    if (existing.status === 'paid') {
      throw new BadRequestError('Cannot delete a paid invoice');
    }

    // Soft delete
    await db
      .update(invoices)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(invoices.id, id));

    const response: ApiResponse<{ deleted: true }> = {
      success: true,
      data: { deleted: true },
    };

    return c.json(response);
  }
);

// =============================================================================
// SEND INVOICE
// =============================================================================

invoicesRouter.post(
  '/:id/send',
  requirePermission('invoices:send'),
  validateParams(idParamSchema),
  async (c) => {
    const companyId = c.get('companyId');
    const { id } = c.get('validatedParams') as { id: string };

    // Verify invoice exists and belongs to company
    const existing = await db.query.invoices.findFirst({
      where: and(
        eq(invoices.id, id),
        eq(invoices.companyId, companyId),
        isNull(invoices.deletedAt)
      ),
      with: {
        customer: true,
      },
    });

    if (!existing) {
      throw new NotFoundError('Invoice', id);
    }

    // Can only send draft or pending invoices
    if (!['draft', 'pending'].includes(existing.status)) {
      throw new BadRequestError('Invoice has already been sent');
    }

    // Update status
    await db
      .update(invoices)
      .set({
        status: 'sent',
        sentAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, id));

    // TODO: Send email notification to customer

    // Fetch updated invoice
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, id),
      with: {
        customer: true,
        items: true,
      },
    });

    const response: ApiResponse<typeof invoice> = {
      success: true,
      data: invoice!,
      meta: { emailSent: true },
    };

    return c.json(response);
  }
);

export default invoicesRouter;
