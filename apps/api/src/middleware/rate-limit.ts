/**
 * Rate Limiting Middleware
 *
 * Protects against DoS and brute force attacks.
 * Following patterns from docs/SECURITY_GUIDE.md#rate-limiting
 */

import type { Context, Next } from 'hono';

// =============================================================================
// CONFIGURATION
// =============================================================================

interface RateLimitConfig {
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum requests per window */
  limit: number;
  /** Function to generate unique key for rate limiting */
  keyGenerator?: (c: Context) => string;
  /** Skip rate limiting for certain requests */
  skip?: (c: Context) => boolean;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  keyGenerator: (c) => {
    // Use user ID if authenticated, otherwise use IP
    const userId = c.get('userId');
    if (userId) return `user:${userId}`;

    const forwarded = c.req.header('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || 'anonymous';
    return `ip:${ip}`;
  },
};

// =============================================================================
// IN-MEMORY STORE (replace with Redis in production)
// =============================================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 60 * 1000); // Every minute

// =============================================================================
// MIDDLEWARE
// =============================================================================

/**
 * Create rate limiting middleware.
 *
 * @example
 * ```typescript
 * // General API rate limiting
 * app.use('*', rateLimiter({ windowMs: 15 * 60 * 1000, limit: 100 }));
 *
 * // Strict rate limiting for auth endpoints
 * app.use('/auth/*', rateLimiter({ windowMs: 15 * 60 * 1000, limit: 5 }));
 * ```
 */
export function rateLimiter(config: Partial<RateLimitConfig> = {}) {
  const options: RateLimitConfig = { ...DEFAULT_CONFIG, ...config };

  return async (c: Context, next: Next) => {
    // Check if rate limiting is disabled
    if (process.env.RATE_LIMIT_ENABLED === 'false') {
      await next();
      return;
    }

    // Skip if specified
    if (options.skip?.(c)) {
      await next();
      return;
    }

    const key = options.keyGenerator!(c);
    const now = Date.now();

    // Get or create entry
    let entry = store.get(key);

    if (!entry || entry.resetAt < now) {
      entry = {
        count: 0,
        resetAt: now + options.windowMs,
      };
    }

    entry.count++;
    store.set(key, entry);

    // Calculate remaining
    const remaining = Math.max(0, options.limit - entry.count);
    const resetSeconds = Math.ceil((entry.resetAt - now) / 1000);

    // Set rate limit headers
    c.header('X-RateLimit-Limit', String(options.limit));
    c.header('X-RateLimit-Remaining', String(remaining));
    c.header('X-RateLimit-Reset', String(resetSeconds));

    // Check if exceeded
    if (entry.count > options.limit) {
      c.header('Retry-After', String(resetSeconds));

      return c.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests, please try again later',
            retryAfter: resetSeconds,
          },
        },
        429
      );
    }

    await next();
  };
}

// =============================================================================
// PRESET RATE LIMITERS
// =============================================================================

/**
 * General API rate limiter.
 * 100 requests per 15 minutes.
 */
export const apiRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 100,
});

/**
 * Strict rate limiter for authentication endpoints.
 * 5 requests per 15 minutes.
 */
export const authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  keyGenerator: (c) => {
    // Rate limit by IP for auth endpoints
    const forwarded = c.req.header('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || 'anonymous';
    return `auth:${ip}`;
  },
});

/**
 * Very strict rate limiter for sensitive operations.
 * 3 requests per hour.
 */
export const sensitiveRateLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 3,
});
