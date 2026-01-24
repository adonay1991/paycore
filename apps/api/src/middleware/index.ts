/**
 * Middleware Exports
 *
 * Re-exports all middleware for convenient imports.
 */

// Authentication & Authorization
export {
  requireAuth,
  requirePermission,
  requireRole,
  optionalAuth,
  type AuthUser,
} from './auth';

// Request Validation
export {
  validateBody,
  validateQuery,
  validateParams,
  idParamSchema,
  type IdParam,
} from './validation';

// Rate Limiting
export {
  rateLimiter,
  apiRateLimiter,
  authRateLimiter,
  sensitiveRateLimiter,
} from './rate-limit';

// Error Handling
export {
  errorHandler,
  notFoundHandler,
  AppError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
  BadRequestError,
} from './error-handler';
