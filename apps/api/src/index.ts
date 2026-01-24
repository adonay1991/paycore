/**
 * PayCore API Server
 *
 * Main entry point for the API server.
 * Following patterns from docs/DATA_ARCHITECTURE.md#api-design-patterns
 */

import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { timing } from 'hono/timing';

import apiRouter from './routes';
import {
  errorHandler,
  notFoundHandler,
  apiRateLimiter,
} from './middleware';
import { checkDatabaseConnection, closeDatabase } from './db';

// =============================================================================
// APP INITIALIZATION
// =============================================================================

const app = new Hono();

// =============================================================================
// GLOBAL MIDDLEWARE
// =============================================================================

// Request timing
app.use('*', timing());

// Security headers
app.use('*', secureHeaders());

// Request logging
app.use('*', logger());

// CORS configuration
app.use(
  '*',
  cors({
    origin: process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
    ],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Company-ID'],
    exposeHeaders: [
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
    ],
    credentials: true,
    maxAge: 86400, // 24 hours
  })
);

// Rate limiting for API routes
app.use('/api/*', apiRateLimiter);

// =============================================================================
// HEALTH CHECK ROUTES
// =============================================================================

/**
 * Basic health check - always responds if server is running
 */
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Deep health check - verifies database connectivity
 */
app.get('/health/ready', async (c) => {
  const dbHealthy = await checkDatabaseConnection();

  if (!dbHealthy) {
    return c.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'failed',
        },
      },
      503
    );
  }

  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: 'ok',
    },
  });
});

// =============================================================================
// ROOT ROUTE
// =============================================================================

app.get('/', (c) => {
  return c.json({
    name: 'PayCore API',
    version: '1.0.0',
    description: 'Payment and debt recovery management platform',
    timestamp: new Date().toISOString(),
    docs: '/docs',
    health: '/health',
  });
});

// =============================================================================
// API ROUTES
// =============================================================================

app.route('/api', apiRouter);

// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 handler for unmatched routes
app.notFound(notFoundHandler);

// Global error handler
app.onError(errorHandler);

// =============================================================================
// SERVER STARTUP
// =============================================================================

const port = Number(process.env.PORT) || 3002;

const server = Bun.serve({
  fetch: app.fetch,
  port,
  development: process.env.NODE_ENV === 'development' ? { hmr: true } : false,
});

console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 PayCore API Server                                    ║
║                                                            ║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(42)}║
║   URL:         ${server.url.toString().padEnd(42)}║
║   Port:        ${String(port).padEnd(42)}║
║                                                            ║
║   Endpoints:                                               ║
║   • GET  /                  - API info                     ║
║   • GET  /health            - Health check                 ║
║   • GET  /health/ready      - Deep health check            ║
║   • /api/invoices           - Invoice management           ║
║   • /api/customers          - Customer management          ║
║   • /api/payments           - Payment processing           ║
║   • /api/debt-cases         - Debt case management         ║
║   • /api/voice-agents       - Voice agent management       ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`);

// =============================================================================
// GRACEFUL SHUTDOWN
// =============================================================================

const shutdown = async (signal: string) => {
  console.log(`\n🛑 ${signal} received, shutting down gracefully...`);

  try {
    // Close database connections
    await closeDatabase();
    console.log('✅ Database connections closed');

    // Stop accepting new connections
    server.stop();
    console.log('✅ Server stopped');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Export for testing purposes only (not as default to prevent Bun from auto-serving)
export { app };
