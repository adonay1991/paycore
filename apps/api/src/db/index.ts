/**
 * Database Connection - Drizzle ORM with PostgreSQL
 *
 * Configuration for connecting to Supabase PostgreSQL database.
 * Following patterns from docs/DATA_ARCHITECTURE.md
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// =============================================================================
// ENVIRONMENT VALIDATION
// =============================================================================

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL environment variable is not set. ' +
      'Please configure your Supabase connection string.'
  );
}

// =============================================================================
// CONNECTION CONFIGURATION
// =============================================================================

/**
 * PostgreSQL connection client with connection pooling.
 * Configured for optimal performance with Supabase.
 */
const client = postgres(databaseUrl, {
  // Connection pool settings
  max: 10, // Maximum connections in pool
  idle_timeout: 20, // Close idle connections after 20s
  connect_timeout: 10, // Connection timeout 10s

  // SSL configuration (required for Supabase)
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,

  // Prepare statements for better performance
  prepare: true,

  // Connection lifecycle hooks
  onnotice: () => {
    // Silence notices in development
  },
});

// =============================================================================
// DRIZZLE ORM INSTANCE
// =============================================================================

/**
 * Drizzle ORM instance with full schema.
 * Use this for all database operations.
 *
 * @example
 * ```typescript
 * import { db } from './db';
 * import { invoices } from './db/schema';
 * import { eq } from 'drizzle-orm';
 *
 * const invoice = await db.query.invoices.findFirst({
 *   where: eq(invoices.id, invoiceId),
 *   with: { items: true, customer: true }
 * });
 * ```
 */
export const db = drizzle(client, {
  schema,
  logger: process.env.NODE_ENV === 'development',
});

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check database connection health.
 * Useful for health check endpoints.
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await client`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

/**
 * Close database connection.
 * Call this when shutting down the server.
 */
export async function closeDatabase(): Promise<void> {
  await client.end();
}

// =============================================================================
// TRANSACTION HELPER
// =============================================================================

/**
 * Execute operations in a database transaction.
 *
 * @example
 * ```typescript
 * const result = await withTransaction(async (tx) => {
 *   const invoice = await tx.insert(invoices).values({...}).returning();
 *   const items = await tx.insert(invoiceItems).values([...]).returning();
 *   return { invoice, items };
 * });
 * ```
 */
export async function withTransaction<T>(
  fn: (
    tx: Parameters<typeof db.transaction>[0] extends (
      tx: infer TX
    ) => unknown
      ? TX
      : never
  ) => Promise<T>
): Promise<T> {
  return db.transaction(fn);
}

// =============================================================================
// RE-EXPORTS
// =============================================================================

// Re-export schema for convenience
export * from './schema';

// Export the raw postgres client for advanced use cases
export { client as pgClient };
