/**
 * Database Reset Script
 *
 * Drops all tables and re-runs migrations + seed.
 * DANGER: This will delete ALL data!
 *
 * Run with: bun run db:reset
 */

import { db, pgClient } from './index';
import { sql } from 'drizzle-orm';

async function reset() {
  console.log('🗑️  Resetting database...\n');
  console.log('⚠️  WARNING: This will delete ALL data!\n');

  try {
    // Drop all tables in the public schema
    console.log('Dropping all tables...');

    // Get all table names
    const tables = await db.execute(sql`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
    `);

    // Drop each table
    for (const row of tables.rows) {
      const tableName = row.tablename as string;
      console.log(`  Dropping ${tableName}...`);
      await db.execute(sql.raw(`DROP TABLE IF EXISTS "${tableName}" CASCADE`));
    }

    // Drop all enums
    console.log('\nDropping all enums...');
    const enums = await db.execute(sql`
      SELECT t.typname
      FROM pg_type t
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public' AND t.typtype = 'e'
    `);

    for (const row of enums.rows) {
      const enumName = row.typname as string;
      console.log(`  Dropping ${enumName}...`);
      await db.execute(sql.raw(`DROP TYPE IF EXISTS "${enumName}" CASCADE`));
    }

    console.log('\n✅ Database reset complete!');
    console.log('\nNext steps:');
    console.log('  1. Run: bun run db:push    (to create tables from schema)');
    console.log('  2. Run: bun run db:seed    (to populate with demo data)');
    console.log('\nOr run: bun run db:setup    (to do both at once)');
  } catch (error) {
    console.error('\n❌ Reset failed:', error);
    throw error;
  } finally {
    await pgClient.end();
  }
}

reset()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
