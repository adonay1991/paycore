/**
 * Customer Routes
 *
 * CRUD operations for customers.
 * Following patterns from docs/DATA_ARCHITECTURE.md#api-design-patterns
 */

import { Hono } from 'hono';
import { and, desc, eq, ilike, isNull, sql } from 'drizzle-orm';
import { db, customers } from '../db';
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
  createCustomerSchema,
  updateCustomerSchema,
  paginationSchema,
  type CreateCustomerInput,
  type UpdateCustomerInput,
} from '../validators';
import type { ApiResponse, PaginatedResponse, Customer } from '@paycore/types';
import { z } from 'zod';

// =============================================================================
// ROUTER
// =============================================================================

const customersRouter = new Hono();

// All routes require authentication
customersRouter.use('*', requireAuth);

// =============================================================================
// FILTER SCHEMA
// =============================================================================

const customerFilterSchema = paginationSchema.extend({
  search: z.string().max(100).optional(),
});

type CustomerFilterInput = z.infer<typeof customerFilterSchema>;

// =============================================================================
// LIST CUSTOMERS
// =============================================================================

customersRouter.get(
  '/',
  requirePermission('invoices:read'), // Same permission as invoices
  validateQuery(customerFilterSchema),
  async (c) => {
    const companyId = c.get('companyId');
    const filters = c.get('validatedQuery') as CustomerFilterInput;

    // Build query conditions
    const conditions = [
      eq(customers.companyId, companyId),
      isNull(customers.deletedAt),
    ];

    if (filters.search) {
      conditions.push(
        sql`(${ilike(customers.name, `%${filters.search}%`)} OR ${ilike(customers.email, `%${filters.search}%`)})`
      );
    }

    if (filters.cursor) {
      conditions.push(sql`${customers.id} < ${filters.cursor}`);
    }

    // Execute query
    const results = await db
      .select()
      .from(customers)
      .where(and(...conditions))
      .orderBy(desc(customers.createdAt))
      .limit(filters.limit + 1);

    // Check for more results
    const hasMore = results.length > filters.limit;
    const data = hasMore ? results.slice(0, -1) : results;
    const nextCursor = hasMore ? data[data.length - 1]?.id : null;

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(customers)
      .where(
        and(eq(customers.companyId, companyId), isNull(customers.deletedAt))
      );

    const response: PaginatedResponse<Customer> = {
      success: true,
      data: data as Customer[],
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
// GET CUSTOMER BY ID
// =============================================================================

customersRouter.get(
  '/:id',
  requirePermission('invoices:read'),
  validateParams(idParamSchema),
  async (c) => {
    const companyId = c.get('companyId');
    const { id } = c.get('validatedParams') as { id: string };

    const customer = await db.query.customers.findFirst({
      where: and(
        eq(customers.id, id),
        eq(customers.companyId, companyId),
        isNull(customers.deletedAt)
      ),
    });

    if (!customer) {
      throw new NotFoundError('Customer', id);
    }

    const response: ApiResponse<typeof customer> = {
      success: true,
      data: customer,
    };

    return c.json(response);
  }
);

// =============================================================================
// CREATE CUSTOMER
// =============================================================================

customersRouter.post(
  '/',
  requirePermission('invoices:write'),
  validateBody(createCustomerSchema),
  async (c) => {
    const companyId = c.get('companyId');
    const input = c.get('validatedBody') as CreateCustomerInput;

    // Verify company matches
    if (input.companyId !== companyId) {
      throw new BadRequestError('Company ID mismatch');
    }

    // Check for duplicate email within company
    const existing = await db.query.customers.findFirst({
      where: and(
        eq(customers.companyId, companyId),
        eq(customers.email, input.email),
        isNull(customers.deletedAt)
      ),
    });

    if (existing) {
      throw new BadRequestError('A customer with this email already exists');
    }

    // Create customer
    const [customer] = await db
      .insert(customers)
      .values({
        companyId,
        name: input.name,
        email: input.email,
        taxId: input.taxId,
        address: input.address,
        city: input.city,
        postalCode: input.postalCode,
        country: input.country,
        phone: input.phone,
        contactPerson: input.contactPerson,
        notes: input.notes,
      })
      .returning();

    const response: ApiResponse<typeof customer> = {
      success: true,
      data: customer,
    };

    return c.json(response, 201);
  }
);

// =============================================================================
// UPDATE CUSTOMER
// =============================================================================

customersRouter.put(
  '/:id',
  requirePermission('invoices:write'),
  validateParams(idParamSchema),
  validateBody(updateCustomerSchema),
  async (c) => {
    const companyId = c.get('companyId');
    const { id } = c.get('validatedParams') as { id: string };
    const input = c.get('validatedBody') as UpdateCustomerInput;

    // Verify customer exists and belongs to company
    const existing = await db.query.customers.findFirst({
      where: and(
        eq(customers.id, id),
        eq(customers.companyId, companyId),
        isNull(customers.deletedAt)
      ),
    });

    if (!existing) {
      throw new NotFoundError('Customer', id);
    }

    // Check for duplicate email if changing
    if (input.email && input.email !== existing.email) {
      const duplicate = await db.query.customers.findFirst({
        where: and(
          eq(customers.companyId, companyId),
          eq(customers.email, input.email),
          isNull(customers.deletedAt)
        ),
      });

      if (duplicate) {
        throw new BadRequestError('A customer with this email already exists');
      }
    }

    // Update customer
    const [customer] = await db
      .update(customers)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, id))
      .returning();

    const response: ApiResponse<typeof customer> = {
      success: true,
      data: customer,
    };

    return c.json(response);
  }
);

// =============================================================================
// DELETE CUSTOMER (soft delete)
// =============================================================================

customersRouter.delete(
  '/:id',
  requirePermission('invoices:delete'),
  validateParams(idParamSchema),
  async (c) => {
    const companyId = c.get('companyId');
    const { id } = c.get('validatedParams') as { id: string };

    // Verify customer exists and belongs to company
    const existing = await db.query.customers.findFirst({
      where: and(
        eq(customers.id, id),
        eq(customers.companyId, companyId),
        isNull(customers.deletedAt)
      ),
    });

    if (!existing) {
      throw new NotFoundError('Customer', id);
    }

    // Soft delete
    await db
      .update(customers)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(customers.id, id));

    const response: ApiResponse<{ deleted: true }> = {
      success: true,
      data: { deleted: true },
    };

    return c.json(response);
  }
);

export default customersRouter;
