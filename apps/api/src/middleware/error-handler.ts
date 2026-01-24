/**
 * Error Handler Middleware
 *
 * Centralized error handling for the API.
 * Following patterns from docs/SECURITY_GUIDE.md#error-handling
 */

import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';

// =============================================================================
// ERROR TYPES
// =============================================================================

/**
 * Application-specific error.
 * Use this for known error conditions.
 */
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Not found error.
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      'NOT_FOUND',
      id ? `${resource} with ID ${id} not found` : `${resource} not found`,
      404
    );
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict error (e.g., duplicate entry).
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super('CONFLICT', message, 409);
    this.name = 'ConflictError';
  }
}

/**
 * Forbidden error.
 */
export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super('FORBIDDEN', message, 403);
    this.name = 'ForbiddenError';
  }
}

/**
 * Bad request error.
 */
export class BadRequestError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('BAD_REQUEST', message, 400, details);
    this.name = 'BadRequestError';
  }
}

// =============================================================================
// ERROR HANDLER
// =============================================================================

/**
 * Global error handler.
 * Catches all unhandled errors and returns a consistent response.
 */
export function errorHandler(error: Error, c: Context) {
  // Log error (without sensitive data in production)
  console.error('API Error:', {
    name: error.name,
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    path: c.req.path,
    method: c.req.method,
    userId: c.get('userId'),
    companyId: c.get('companyId'),
  });

  // Handle AppError
  if (error instanceof AppError) {
    return c.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          ...(error.details && { details: error.details }),
        },
      },
      error.statusCode as 400 | 401 | 403 | 404 | 409 | 500
    );
  }

  // Handle HTTPException from Hono
  if (error instanceof HTTPException) {
    return c.json(
      {
        success: false,
        error: {
          code: `HTTP_${error.status}`,
          message: error.message,
        },
      },
      error.status
    );
  }

  // Handle unknown errors
  // In production, never expose internal error details
  if (process.env.NODE_ENV === 'production') {
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          requestId: crypto.randomUUID(),
        },
      },
      500
    );
  }

  // In development, show error details
  return c.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
        stack: error.stack,
      },
    },
    500
  );
}

// =============================================================================
// NOT FOUND HANDLER
// =============================================================================

/**
 * Handler for routes that don't exist.
 */
export function notFoundHandler(c: Context) {
  return c.json(
    {
      success: false,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: `Route ${c.req.method} ${c.req.path} not found`,
      },
    },
    404
  );
}
