/**
 * Routes Index
 *
 * Central routing configuration for the API.
 * Following patterns from docs/DATA_ARCHITECTURE.md#api-design-patterns
 */

import { Hono } from 'hono';
import invoicesRouter from './invoices';
import customersRouter from './customers';
import paymentsRouter from './payments';
import debtCasesRouter from './debt-cases';
import { voiceAgentsRoutes } from './voice-agents.routes';

// =============================================================================
// API ROUTER
// =============================================================================

const apiRouter = new Hono();

// Mount resource routers
apiRouter.route('/invoices', invoicesRouter);
apiRouter.route('/customers', customersRouter);
apiRouter.route('/payments', paymentsRouter);
apiRouter.route('/debt-cases', debtCasesRouter);
apiRouter.route('/voice-agents', voiceAgentsRoutes);

// =============================================================================
// EXPORTS
// =============================================================================

export default apiRouter;
export {
  invoicesRouter,
  customersRouter,
  paymentsRouter,
  debtCasesRouter,
  voiceAgentsRoutes,
};
