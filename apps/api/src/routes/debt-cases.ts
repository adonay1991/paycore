/**
 * Debt Case Routes
 *
 * CRUD operations for debt cases and debt case activities.
 * Following patterns from docs/DATA_ARCHITECTURE.md#api-design-patterns
 */

import { Hono } from 'hono';
import { and, desc, eq, gte, isNull, lte, sql } from 'drizzle-orm';
import {
  db,
  debtCases,
  debtCaseActivities,
  invoices,
  users,
  customers,
} from '../db';
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
  createDebtCaseSchema,
  updateDebtCaseSchema,
  debtCaseFilterSchema,
  createDebtCaseActivitySchema,
  paginationSchema,
  type CreateDebtCaseInput,
  type UpdateDebtCaseInput,
  type DebtCaseFilterInput,
  type CreateDebtCaseActivityInput,
} from '../validators';
import type { ApiResponse, PaginatedResponse } from '@paycore/types';
import { z } from 'zod';

// =============================================================================
// ROUTER
// =============================================================================

const debtCasesRouter = new Hono();

// All routes require authentication
debtCasesRouter.use('*', requireAuth);

// =============================================================================
// LIST DEBT CASES
// =============================================================================

debtCasesRouter.get(
  '/',
  requirePermission('debt_cases:read'),
  validateQuery(debtCaseFilterSchema),
  async (c) => {
    const companyId = c.get('companyId');
    const filters = c.get('validatedQuery') as DebtCaseFilterInput;

    // Build query conditions
    const conditions = [
      eq(debtCases.companyId, companyId),
      isNull(debtCases.deletedAt),
    ];

    if (filters.status) {
      const statuses = Array.isArray(filters.status)
        ? filters.status
        : [filters.status];
      conditions.push(sql`${debtCases.status} = ANY(${statuses})`);
    }

    if (filters.priority) {
      const priorities = Array.isArray(filters.priority)
        ? filters.priority
        : [filters.priority];
      conditions.push(sql`${debtCases.priority} = ANY(${priorities})`);
    }

    if (filters.assignedToId) {
      conditions.push(eq(debtCases.assignedToId, filters.assignedToId));
    }

    if (filters.minDebt !== undefined) {
      conditions.push(gte(debtCases.totalDebt, String(filters.minDebt)));
    }

    if (filters.maxDebt !== undefined) {
      conditions.push(lte(debtCases.totalDebt, String(filters.maxDebt)));
    }

    if (filters.cursor) {
      conditions.push(sql`${debtCases.id} < ${filters.cursor}`);
    }

    // Execute query
    const results = await db
      .select()
      .from(debtCases)
      .where(and(...conditions))
      .orderBy(desc(debtCases.createdAt))
      .limit(filters.limit + 1);

    // Check for more results
    const hasMore = results.length > filters.limit;
    const data = hasMore ? results.slice(0, -1) : results;
    const nextCursor = hasMore ? data[data.length - 1]?.id : null;

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(debtCases)
      .where(
        and(eq(debtCases.companyId, companyId), isNull(debtCases.deletedAt))
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
// GET DEBT CASE BY ID
// =============================================================================

debtCasesRouter.get(
  '/:id',
  requirePermission('debt_cases:read'),
  validateParams(idParamSchema),
  async (c) => {
    const companyId = c.get('companyId');
    const { id } = c.get('validatedParams') as { id: string };

    // Fetch debt case with relations
    const debtCase = await db.query.debtCases.findFirst({
      where: and(
        eq(debtCases.id, id),
        eq(debtCases.companyId, companyId),
        isNull(debtCases.deletedAt)
      ),
      with: {
        invoice: {
          with: {
            customer: true,
            items: true,
          },
        },
        assignedTo: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
        activities: {
          orderBy: (activities, { desc }) => [desc(activities.createdAt)],
          limit: 20,
          with: {
            user: {
              columns: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!debtCase) {
      throw new NotFoundError('Debt Case', id);
    }

    const response: ApiResponse<typeof debtCase> = {
      success: true,
      data: debtCase,
    };

    return c.json(response);
  }
);

// =============================================================================
// CREATE DEBT CASE
// =============================================================================

debtCasesRouter.post(
  '/',
  requirePermission('debt_cases:write'),
  validateBody(createDebtCaseSchema),
  async (c) => {
    const companyId = c.get('companyId');
    const input = c.get('validatedBody') as CreateDebtCaseInput;

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

    // Check if debt case already exists for this invoice
    const existingCase = await db.query.debtCases.findFirst({
      where: and(
        eq(debtCases.invoiceId, input.invoiceId),
        isNull(debtCases.deletedAt)
      ),
    });

    if (existingCase) {
      throw new BadRequestError('A debt case already exists for this invoice');
    }

    // Check if invoice has outstanding balance
    const outstandingBalance =
      Number(invoice.total) - Number(invoice.paidAmount);
    if (outstandingBalance <= 0) {
      throw new BadRequestError(
        'Cannot create debt case for fully paid invoice'
      );
    }

    // Verify assigned user exists and belongs to company
    if (input.assignedToId) {
      const assignedUser = await db.query.users.findFirst({
        where: and(
          eq(users.id, input.assignedToId),
          eq(users.companyId, companyId),
          isNull(users.deletedAt)
        ),
      });

      if (!assignedUser) {
        throw new NotFoundError('User', input.assignedToId);
      }
    }

    // Create debt case
    const [debtCase] = await db
      .insert(debtCases)
      .values({
        invoiceId: input.invoiceId,
        companyId,
        status: 'new',
        priority: input.priority || 'medium',
        assignedToId: input.assignedToId,
        totalDebt: String(outstandingBalance),
        currency: invoice.currency,
        notes: input.notes,
      })
      .returning();

    // Fetch complete debt case with relations
    const result = await db.query.debtCases.findFirst({
      where: eq(debtCases.id, debtCase.id),
      with: {
        invoice: {
          with: {
            customer: true,
          },
        },
        assignedTo: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result!,
    };

    return c.json(response, 201);
  }
);

// =============================================================================
// UPDATE DEBT CASE
// =============================================================================

debtCasesRouter.put(
  '/:id',
  requirePermission('debt_cases:write'),
  validateParams(idParamSchema),
  validateBody(updateDebtCaseSchema),
  async (c) => {
    const companyId = c.get('companyId');
    const userId = c.get('userId');
    const { id } = c.get('validatedParams') as { id: string };
    const input = c.get('validatedBody') as UpdateDebtCaseInput;

    // Verify debt case exists and belongs to company
    const existing = await db.query.debtCases.findFirst({
      where: and(
        eq(debtCases.id, id),
        eq(debtCases.companyId, companyId),
        isNull(debtCases.deletedAt)
      ),
    });

    if (!existing) {
      throw new NotFoundError('Debt Case', id);
    }

    // Verify assigned user if changing
    if (input.assignedToId && input.assignedToId !== existing.assignedToId) {
      const assignedUser = await db.query.users.findFirst({
        where: and(
          eq(users.id, input.assignedToId),
          eq(users.companyId, companyId),
          isNull(users.deletedAt)
        ),
      });

      if (!assignedUser) {
        throw new NotFoundError('User', input.assignedToId);
      }
    }

    // Build update object
    const updates: Partial<typeof debtCases.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (input.status) updates.status = input.status;
    if (input.priority) updates.priority = input.priority;
    if (input.assignedToId !== undefined)
      updates.assignedToId = input.assignedToId;
    if (input.nextActionAt !== undefined)
      updates.nextActionAt = input.nextActionAt;
    if (input.nextAction !== undefined) updates.nextAction = input.nextAction;
    if (input.notes !== undefined) updates.notes = input.notes;

    // Handle status transitions
    if (input.status === 'escalated' && existing.status !== 'escalated') {
      updates.escalatedAt = new Date();
    }
    if (
      input.status === 'resolved' &&
      existing.status !== 'resolved'
    ) {
      updates.resolvedAt = new Date();
    }

    // Update debt case in transaction
    const result = await db.transaction(async (tx) => {
      // Update the debt case
      const [updated] = await tx
        .update(debtCases)
        .set(updates)
        .where(eq(debtCases.id, id))
        .returning();

      // Create activity log for status change
      if (input.status && input.status !== existing.status) {
        await tx.insert(debtCaseActivities).values({
          debtCaseId: id,
          userId,
          action: 'status_changed',
          notes: `Status changed from ${existing.status} to ${input.status}`,
        });
      }

      return updated;
    });

    // Fetch complete debt case with relations
    const debtCase = await db.query.debtCases.findFirst({
      where: eq(debtCases.id, id),
      with: {
        invoice: {
          with: {
            customer: true,
          },
        },
        assignedTo: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const response: ApiResponse<typeof debtCase> = {
      success: true,
      data: debtCase!,
    };

    return c.json(response);
  }
);

// =============================================================================
// DELETE DEBT CASE (soft delete)
// =============================================================================

debtCasesRouter.delete(
  '/:id',
  requirePermission('debt_cases:delete'),
  validateParams(idParamSchema),
  async (c) => {
    const companyId = c.get('companyId');
    const { id } = c.get('validatedParams') as { id: string };

    // Verify debt case exists and belongs to company
    const existing = await db.query.debtCases.findFirst({
      where: and(
        eq(debtCases.id, id),
        eq(debtCases.companyId, companyId),
        isNull(debtCases.deletedAt)
      ),
    });

    if (!existing) {
      throw new NotFoundError('Debt Case', id);
    }

    // Soft delete
    await db
      .update(debtCases)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(debtCases.id, id));

    const response: ApiResponse<{ deleted: true }> = {
      success: true,
      data: { deleted: true },
    };

    return c.json(response);
  }
);

// =============================================================================
// ASSIGN DEBT CASE
// =============================================================================

debtCasesRouter.post(
  '/:id/assign',
  requirePermission('debt_cases:assign'),
  validateParams(idParamSchema),
  validateBody(z.object({ userId: z.string().uuid() })),
  async (c) => {
    const companyId = c.get('companyId');
    const currentUserId = c.get('userId');
    const { id } = c.get('validatedParams') as { id: string };
    const { userId: assignToId } = c.get('validatedBody') as {
      userId: string;
    };

    // Verify debt case exists and belongs to company
    const existing = await db.query.debtCases.findFirst({
      where: and(
        eq(debtCases.id, id),
        eq(debtCases.companyId, companyId),
        isNull(debtCases.deletedAt)
      ),
    });

    if (!existing) {
      throw new NotFoundError('Debt Case', id);
    }

    // Verify target user exists and belongs to company
    const assignedUser = await db.query.users.findFirst({
      where: and(
        eq(users.id, assignToId),
        eq(users.companyId, companyId),
        isNull(users.deletedAt)
      ),
    });

    if (!assignedUser) {
      throw new NotFoundError('User', assignToId);
    }

    // Update assignment and create activity
    await db.transaction(async (tx) => {
      await tx
        .update(debtCases)
        .set({
          assignedToId: assignToId,
          updatedAt: new Date(),
        })
        .where(eq(debtCases.id, id));

      await tx.insert(debtCaseActivities).values({
        debtCaseId: id,
        userId: currentUserId,
        action: 'assigned',
        notes: `Assigned to ${assignedUser.name}`,
      });
    });

    // Fetch updated debt case
    const debtCase = await db.query.debtCases.findFirst({
      where: eq(debtCases.id, id),
      with: {
        assignedTo: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const response: ApiResponse<typeof debtCase> = {
      success: true,
      data: debtCase!,
    };

    return c.json(response);
  }
);

// =============================================================================
// DEBT CASE ACTIVITIES
// =============================================================================

// List activities for a debt case
debtCasesRouter.get(
  '/:id/activities',
  requirePermission('debt_cases:read'),
  validateParams(idParamSchema),
  validateQuery(paginationSchema),
  async (c) => {
    const companyId = c.get('companyId');
    const { id } = c.get('validatedParams') as { id: string };
    const pagination = c.get('validatedQuery') as z.infer<
      typeof paginationSchema
    >;

    // Verify debt case exists and belongs to company
    const debtCase = await db.query.debtCases.findFirst({
      where: and(
        eq(debtCases.id, id),
        eq(debtCases.companyId, companyId),
        isNull(debtCases.deletedAt)
      ),
    });

    if (!debtCase) {
      throw new NotFoundError('Debt Case', id);
    }

    // Build conditions
    const conditions = [eq(debtCaseActivities.debtCaseId, id)];

    if (pagination.cursor) {
      conditions.push(sql`${debtCaseActivities.id} < ${pagination.cursor}`);
    }

    // Fetch activities
    const results = await db
      .select({
        id: debtCaseActivities.id,
        debtCaseId: debtCaseActivities.debtCaseId,
        userId: debtCaseActivities.userId,
        action: debtCaseActivities.action,
        notes: debtCaseActivities.notes,
        contactMethod: debtCaseActivities.contactMethod,
        outcome: debtCaseActivities.outcome,
        createdAt: debtCaseActivities.createdAt,
        user: {
          id: users.id,
          name: users.name,
        },
      })
      .from(debtCaseActivities)
      .leftJoin(users, eq(debtCaseActivities.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(debtCaseActivities.createdAt))
      .limit(pagination.limit + 1);

    // Check for more results
    const hasMore = results.length > pagination.limit;
    const data = hasMore ? results.slice(0, -1) : results;
    const nextCursor = hasMore ? data[data.length - 1]?.id : null;

    const response: PaginatedResponse<(typeof data)[0]> = {
      success: true,
      data,
      pagination: {
        cursor: nextCursor,
        hasMore,
      },
    };

    return c.json(response);
  }
);

// Add activity to debt case
debtCasesRouter.post(
  '/:id/activities',
  requirePermission('debt_cases:write'),
  validateParams(idParamSchema),
  validateBody(createDebtCaseActivitySchema.omit({ debtCaseId: true })),
  async (c) => {
    const companyId = c.get('companyId');
    const userId = c.get('userId');
    const { id } = c.get('validatedParams') as { id: string };
    const input = c.get('validatedBody') as Omit<
      CreateDebtCaseActivityInput,
      'debtCaseId'
    >;

    // Verify debt case exists and belongs to company
    const debtCase = await db.query.debtCases.findFirst({
      where: and(
        eq(debtCases.id, id),
        eq(debtCases.companyId, companyId),
        isNull(debtCases.deletedAt)
      ),
    });

    if (!debtCase) {
      throw new NotFoundError('Debt Case', id);
    }

    // Create activity and update last contact if applicable
    const result = await db.transaction(async (tx) => {
      // Insert activity
      const [activity] = await tx
        .insert(debtCaseActivities)
        .values({
          debtCaseId: id,
          userId,
          action: input.action,
          notes: input.notes,
          contactMethod: input.contactMethod,
          outcome: input.outcome,
        })
        .returning();

      // Update last contact date if this was a contact action
      if (input.contactMethod) {
        await tx
          .update(debtCases)
          .set({
            lastContactAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(debtCases.id, id));
      }

      return activity;
    });

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
    };

    return c.json(response, 201);
  }
);

export default debtCasesRouter;
