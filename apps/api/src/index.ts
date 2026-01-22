import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());

// Routes
app.get('/', (context) => {
  return context.json({
    name: 'paycore API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (context) => {
  return context.json({ status: 'ok' });
});

app.get('/api/users', (context) => {
  return context.json({
    users: [
      { id: '1', email: 'john@example.com', name: 'John Doe' },
      { id: '2', email: 'jane@example.com', name: 'Jane Smith' },
    ],
  });
});

// 404 handler
app.notFound((context) => {
  return context.json({ error: 'Not found' }, 404);
});

// Error handler
app.onError((error, context) => {
  console.error('Error:', error);
  return context.json({ error: 'Internal server error' }, 500);
});

// Start server with HMR
const server = Bun.serve({
  fetch: app.fetch,
  port: 3002,
  development: {
    hmr: true,
  },
});

console.log(`🚀 paycore API running on ${server.url}`);

export default app;
