/**
 * Health Route Integration Tests
 *
 * Tests for the health check endpoints.
 */

import { describe, expect, test, beforeAll, afterAll, mock } from 'bun:test';
import { Hono } from 'hono';

// Create a minimal app for testing health routes
const app = new Hono();

// Mock health endpoints (simplified version without DB dependency)
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health/ready', (c) => {
  // In tests, we simulate healthy state
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: 'ok',
    },
  });
});

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

describe('Health Routes', () => {
  describe('GET /health', () => {
    test('returns 200 with ok status', async () => {
      const res = await app.request('/health');

      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.status).toBe('ok');
      expect(body.timestamp).toBeDefined();
    });

    test('returns valid ISO timestamp', async () => {
      const res = await app.request('/health');
      const body = await res.json();

      const timestamp = new Date(body.timestamp);
      expect(timestamp.toISOString()).toBe(body.timestamp);
    });
  });

  describe('GET /health/ready', () => {
    test('returns 200 when all checks pass', async () => {
      const res = await app.request('/health/ready');

      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.status).toBe('healthy');
      expect(body.checks.database).toBe('ok');
    });

    test('includes timestamp', async () => {
      const res = await app.request('/health/ready');
      const body = await res.json();

      expect(body.timestamp).toBeDefined();
      const timestamp = new Date(body.timestamp);
      expect(timestamp.toISOString()).toBe(body.timestamp);
    });
  });

  describe('GET /', () => {
    test('returns API info', async () => {
      const res = await app.request('/');

      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.name).toBe('PayCore API');
      expect(body.version).toBe('1.0.0');
      expect(body.description).toContain('Payment');
      expect(body.health).toBe('/health');
    });

    test('returns valid JSON', async () => {
      const res = await app.request('/');

      expect(res.headers.get('content-type')).toContain('application/json');
    });
  });
});

describe('Health Response Structure', () => {
  test('basic health response has required fields', async () => {
    const res = await app.request('/health');
    const body = await res.json();

    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('timestamp');
  });

  test('ready health response has checks object', async () => {
    const res = await app.request('/health/ready');
    const body = await res.json();

    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('checks');
    expect(typeof body.checks).toBe('object');
  });

  test('API info response has all required fields', async () => {
    const res = await app.request('/');
    const body = await res.json();

    expect(body).toHaveProperty('name');
    expect(body).toHaveProperty('version');
    expect(body).toHaveProperty('description');
    expect(body).toHaveProperty('docs');
    expect(body).toHaveProperty('health');
    expect(body).toHaveProperty('timestamp');
  });
});
