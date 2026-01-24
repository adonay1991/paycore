#!/usr/bin/env bun
/**
 * Database Migration Script
 *
 * This script handles database migrations for PayCore platform.
 * It can be run locally or in CI/CD pipelines.
 *
 * Usage:
 *   bun run scripts/migrate.ts [command]
 *
 * Commands:
 *   up       - Run all pending migrations
 *   down     - Rollback the last migration
 *   status   - Show migration status
 *   create   - Create a new migration file
 *   reset    - Reset database and run all migrations (DESTRUCTIVE!)
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, basename } from 'node:path';

// =============================================================================
// TYPES
// =============================================================================

interface Migration {
  version: string;
  name: string;
  filename: string;
  appliedAt?: Date;
}

interface MigrationResult {
  success: boolean;
  migration: string;
  error?: string;
  duration: number;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const MIGRATIONS_DIR = join(import.meta.dir, '..', 'supabase', 'migrations');
const MIGRATIONS_TABLE = '_migrations';

// Environment-specific database URLs
function getDatabaseUrl(): string {
  const env = process.env.ENVIRONMENT || process.env.NODE_ENV || 'development';

  switch (env) {
    case 'production':
      return process.env.DATABASE_URL_PRODUCTION || process.env.DATABASE_URL || '';
    case 'staging':
      return process.env.DATABASE_URL_STAGING || process.env.DATABASE_URL || '';
    case 'preview':
      return process.env.DATABASE_URL_PREVIEW || process.env.DATABASE_URL || '';
    default:
      return process.env.DATABASE_URL || '';
  }
}

// =============================================================================
// DATABASE CLIENT
// =============================================================================

async function createDbClient() {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL is not set. Please set DATABASE_URL or DATABASE_URL_[ENVIRONMENT] environment variable.'
    );
  }

  // Use postgres.js for direct database access
  const postgres = await import('postgres');
  return postgres.default(databaseUrl, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });
}

// =============================================================================
// MIGRATIONS TABLE
// =============================================================================

async function ensureMigrationsTable(sql: ReturnType<typeof import('postgres').default>): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS ${sql(MIGRATIONS_TABLE)} (
      id SERIAL PRIMARY KEY,
      version VARCHAR(50) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

async function getAppliedMigrations(sql: ReturnType<typeof import('postgres').default>): Promise<Set<string>> {
  const rows = await sql`
    SELECT version FROM ${sql(MIGRATIONS_TABLE)} ORDER BY version
  `;
  return new Set(rows.map((row: { version: string }) => row.version));
}

async function recordMigration(
  sql: ReturnType<typeof import('postgres').default>,
  version: string,
  name: string
): Promise<void> {
  await sql`
    INSERT INTO ${sql(MIGRATIONS_TABLE)} (version, name)
    VALUES (${version}, ${name})
  `;
}

async function removeMigration(
  sql: ReturnType<typeof import('postgres').default>,
  version: string
): Promise<void> {
  await sql`
    DELETE FROM ${sql(MIGRATIONS_TABLE)}
    WHERE version = ${version}
  `;
}

// =============================================================================
// MIGRATION DISCOVERY
// =============================================================================

async function discoverMigrations(): Promise<Migration[]> {
  const files = await readdir(MIGRATIONS_DIR);

  const migrations: Migration[] = [];

  for (const file of files) {
    if (!file.endsWith('.sql')) continue;

    // Expected format: 00001_name.sql or 00001_name_up.sql
    const match = file.match(/^(\d+)_(.+?)(?:_up)?\.sql$/);
    if (!match) continue;

    const [, version, name] = match;
    migrations.push({
      version,
      name: name.replace(/_/g, ' '),
      filename: file,
    });
  }

  // Sort by version
  migrations.sort((a, b) => a.version.localeCompare(b.version));

  return migrations;
}

// =============================================================================
// MIGRATION COMMANDS
// =============================================================================

async function runMigrations(): Promise<MigrationResult[]> {
  const sql = await createDbClient();
  const results: MigrationResult[] = [];

  try {
    await ensureMigrationsTable(sql);

    const applied = await getAppliedMigrations(sql);
    const migrations = await discoverMigrations();
    const pending = migrations.filter(m => !applied.has(m.version));

    if (pending.length === 0) {
      console.log('✓ No pending migrations');
      return results;
    }

    console.log(`Found ${pending.length} pending migration(s)`);

    for (const migration of pending) {
      const start = Date.now();
      console.log(`\n→ Running migration ${migration.version}: ${migration.name}`);

      try {
        const filePath = join(MIGRATIONS_DIR, migration.filename);
        const content = await readFile(filePath, 'utf-8');

        // Execute migration in a transaction
        await sql.begin(async (tx) => {
          await tx.unsafe(content);
          await recordMigration(tx, migration.version, migration.name);
        });

        const duration = Date.now() - start;
        console.log(`  ✓ Completed in ${duration}ms`);

        results.push({
          success: true,
          migration: migration.filename,
          duration,
        });
      } catch (error) {
        const duration = Date.now() - start;
        const errorMessage = error instanceof Error ? error.message : String(error);

        console.error(`  ✗ Failed: ${errorMessage}`);

        results.push({
          success: false,
          migration: migration.filename,
          error: errorMessage,
          duration,
        });

        // Stop on first failure
        break;
      }
    }

    return results;
  } finally {
    await sql.end();
  }
}

async function showStatus(): Promise<void> {
  const sql = await createDbClient();

  try {
    await ensureMigrationsTable(sql);

    const appliedRows = await sql`
      SELECT version, name, applied_at
      FROM ${sql(MIGRATIONS_TABLE)}
      ORDER BY version
    `;

    const applied = new Map(
      appliedRows.map((row: { version: string; name: string; applied_at: Date }) => [
        row.version,
        { name: row.name, appliedAt: row.applied_at },
      ])
    );

    const migrations = await discoverMigrations();

    console.log('\nMigration Status:');
    console.log('─'.repeat(60));

    for (const migration of migrations) {
      const info = applied.get(migration.version);
      const status = info ? '✓' : '○';
      const appliedAt = info?.appliedAt
        ? ` (applied ${info.appliedAt.toISOString()})`
        : '';

      console.log(`${status} ${migration.version} - ${migration.name}${appliedAt}`);
    }

    const pendingCount = migrations.filter(m => !applied.has(m.version)).length;
    console.log('─'.repeat(60));
    console.log(`Total: ${migrations.length} | Applied: ${applied.size} | Pending: ${pendingCount}`);
  } finally {
    await sql.end();
  }
}

async function createMigration(name: string): Promise<void> {
  const migrations = await discoverMigrations();
  const lastVersion = migrations.length > 0
    ? parseInt(migrations[migrations.length - 1].version, 10)
    : 0;

  const newVersion = String(lastVersion + 1).padStart(5, '0');
  const safeName = name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const filename = `${newVersion}_${safeName}.sql`;
  const filePath = join(MIGRATIONS_DIR, filename);

  const template = `-- Migration: ${name}
-- Version: ${newVersion}
-- Created: ${new Date().toISOString()}

-- =============================================================================
-- UP MIGRATION
-- =============================================================================

-- Add your migration SQL here

-- =============================================================================
-- ROLLBACK (manual)
-- =============================================================================

-- To rollback this migration, run:
-- (Add rollback SQL here as comments for reference)
`;

  await Bun.write(filePath, template);
  console.log(`✓ Created migration: ${filename}`);
}

// =============================================================================
// SCHEMA DIFF (for CI/CD)
// =============================================================================

async function checkSchemaDiff(): Promise<{ hasChanges: boolean; changes: string[] }> {
  const sql = await createDbClient();
  const changes: string[] = [];

  try {
    await ensureMigrationsTable(sql);

    const applied = await getAppliedMigrations(sql);
    const migrations = await discoverMigrations();
    const pending = migrations.filter(m => !applied.has(m.version));

    if (pending.length > 0) {
      changes.push(`${pending.length} pending migration(s) found:`);
      pending.forEach(m => changes.push(`  - ${m.version}: ${m.name}`));
    }

    return {
      hasChanges: pending.length > 0,
      changes,
    };
  } finally {
    await sql.end();
  }
}

// =============================================================================
// CLI
// =============================================================================

async function main() {
  const command = process.argv[2] || 'status';
  const env = process.env.ENVIRONMENT || process.env.NODE_ENV || 'development';

  console.log(`\n🗄️  PayCore Database Migrations`);
  console.log(`   Environment: ${env}`);
  console.log('');

  try {
    switch (command) {
      case 'up':
      case 'migrate': {
        const results = await runMigrations();
        const failed = results.filter(r => !r.success);

        if (failed.length > 0) {
          console.error('\n✗ Migration failed');
          process.exit(1);
        }

        console.log('\n✓ All migrations completed successfully');
        break;
      }

      case 'status': {
        await showStatus();
        break;
      }

      case 'create': {
        const name = process.argv[3];
        if (!name) {
          console.error('Usage: migrate.ts create <name>');
          process.exit(1);
        }
        await createMigration(name);
        break;
      }

      case 'check': {
        // Used by CI/CD to check if migrations are needed
        const { hasChanges, changes } = await checkSchemaDiff();

        if (hasChanges) {
          console.log('Schema changes detected:');
          changes.forEach(c => console.log(c));
          process.exit(1); // Exit with error to indicate changes needed
        } else {
          console.log('✓ Schema is up to date');
        }
        break;
      }

      case 'help':
      default: {
        console.log(`
Usage: bun run scripts/migrate.ts <command>

Commands:
  up, migrate   Run all pending migrations
  status        Show migration status
  create <name> Create a new migration file
  check         Check if migrations are pending (for CI/CD)
  help          Show this help message

Environment Variables:
  DATABASE_URL              Database connection string
  DATABASE_URL_PRODUCTION   Production database URL
  DATABASE_URL_STAGING      Staging database URL
  DATABASE_URL_PREVIEW      Preview database URL
  ENVIRONMENT               Current environment (production/staging/preview/development)
`);
      }
    }
  } catch (error) {
    console.error('\n✗ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
