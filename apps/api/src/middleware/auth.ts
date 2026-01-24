/**
 * Authentication & Authorization Middleware
 *
 * Handles JWT token verification and role-based access control.
 * Following patterns from docs/SECURITY_GUIDE.md#authentication--authorization
 */

import { createClient } from '@supabase/supabase-js';
import type { Context, Next } from 'hono';
import { hasPermission, type Permission, type UserRole } from '@paycore/types';

// =============================================================================
// SUPABASE CLIENT
// =============================================================================

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    'Warning: Supabase credentials not set. Authentication will not work.'
  );
}

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

// =============================================================================
// TYPES
// =============================================================================

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId: string;
}

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthUser;
    userId: string;
    companyId: string;
  }
}

// =============================================================================
// MIDDLEWARE
// =============================================================================

/**
 * Require authentication middleware.
 * Verifies JWT token and attaches user to context.
 */
export async function requireAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid authorization header',
        },
      },
      401
    );
  }

  if (!supabase) {
    return c.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Authentication service not configured',
        },
      },
      500
    );
  }

  const token = authHeader.substring(7);

  try {
    // Verify token with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return c.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid or expired token',
          },
        },
        401
      );
    }

    // Extract user metadata
    const authUser: AuthUser = {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.name || user.email || '',
      role: (user.user_metadata?.role as UserRole) || 'user',
      companyId: user.user_metadata?.company_id || '',
    };

    // Validate required fields
    if (!authUser.companyId) {
      return c.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not associated with any company',
          },
        },
        401
      );
    }

    // Attach user to context
    c.set('user', authUser);
    c.set('userId', authUser.id);
    c.set('companyId', authUser.companyId);

    await next();
  } catch {
    return c.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication failed',
        },
      },
      401
    );
  }
}

/**
 * Require specific permission middleware.
 * Must be used after requireAuth.
 */
export function requirePermission(permission: Permission) {
  return async (c: Context, next: Next) => {
    const user = c.get('user');

    if (!user) {
      return c.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          },
        },
        401
      );
    }

    if (!hasPermission(user.role, permission)) {
      return c.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions',
          },
        },
        403
      );
    }

    await next();
  };
}

/**
 * Require one of the specified roles middleware.
 * Must be used after requireAuth.
 */
export function requireRole(roles: UserRole[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user');

    if (!user) {
      return c.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          },
        },
        401
      );
    }

    if (!roles.includes(user.role)) {
      return c.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient role',
          },
        },
        403
      );
    }

    await next();
  };
}

/**
 * Optional authentication middleware.
 * Attaches user to context if token is valid, but doesn't require it.
 */
export async function optionalAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (authHeader?.startsWith('Bearer ') && supabase) {
    const token = authHeader.substring(7);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser(token);

      if (user) {
        const authUser: AuthUser = {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || user.email || '',
          role: (user.user_metadata?.role as UserRole) || 'user',
          companyId: user.user_metadata?.company_id || '',
        };

        c.set('user', authUser);
        c.set('userId', authUser.id);
        c.set('companyId', authUser.companyId);
      }
    } catch {
      // Ignore errors for optional auth
    }
  }

  await next();
}
