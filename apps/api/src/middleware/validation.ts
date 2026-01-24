/**
 * Request Validation Middleware
 *
 * Validates request body, query params, and path params using Zod schemas.
 * Following patterns from docs/SECURITY_GUIDE.md#input-validation--sanitization
 */

import type { Context, Next } from 'hono';
import { z } from 'zod';

// =============================================================================
// TYPES
// =============================================================================

declare module 'hono' {
  interface ContextVariableMap {
    validatedBody: unknown;
    validatedQuery: unknown;
    validatedParams: unknown;
  }
}

// =============================================================================
// BODY VALIDATION
// =============================================================================

/**
 * Validate request body against a Zod schema.
 *
 * @example
 * ```typescript
 * app.post('/users', validateBody(createUserSchema), async (c) => {
 *   const data = c.get('validatedBody') as CreateUserInput;
 *   // data is now validated and type-safe
 * });
 * ```
 */
export function validateBody<T extends z.ZodType>(schema: T) {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json();
      const validated = schema.parse(body);
      c.set('validatedBody', validated);
      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid request body',
              validationErrors: error.errors.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
                code: e.code,
              })),
            },
          },
          400
        );
      }

      // JSON parse error
      return c.json(
        {
          success: false,
          error: {
            code: 'INVALID_JSON',
            message: 'Invalid JSON in request body',
          },
        },
        400
      );
    }
  };
}

// =============================================================================
// QUERY VALIDATION
// =============================================================================

/**
 * Validate query parameters against a Zod schema.
 *
 * @example
 * ```typescript
 * app.get('/invoices', validateQuery(invoiceFilterSchema), async (c) => {
 *   const filters = c.get('validatedQuery') as InvoiceFilterInput;
 *   // filters are now validated and type-safe
 * });
 * ```
 */
export function validateQuery<T extends z.ZodType>(schema: T) {
  return async (c: Context, next: Next) => {
    try {
      const query = c.req.query();
      const validated = schema.parse(query);
      c.set('validatedQuery', validated);
      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid query parameters',
              validationErrors: error.errors.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
                code: e.code,
              })),
            },
          },
          400
        );
      }
      throw error;
    }
  };
}

// =============================================================================
// PATH PARAMS VALIDATION
// =============================================================================

/**
 * Validate path parameters against a Zod schema.
 *
 * @example
 * ```typescript
 * const idParamSchema = z.object({ id: z.string().uuid() });
 *
 * app.get('/invoices/:id', validateParams(idParamSchema), async (c) => {
 *   const { id } = c.get('validatedParams') as { id: string };
 *   // id is now validated as UUID
 * });
 * ```
 */
export function validateParams<T extends z.ZodType>(schema: T) {
  return async (c: Context, next: Next) => {
    try {
      const params = c.req.param();
      const validated = schema.parse(params);
      c.set('validatedParams', validated);
      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid path parameters',
              validationErrors: error.errors.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
                code: e.code,
              })),
            },
          },
          400
        );
      }
      throw error;
    }
  };
}

// =============================================================================
// COMMON PARAM SCHEMAS
// =============================================================================

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

export type IdParam = z.infer<typeof idParamSchema>;
