# Database Setup Guide

This guide explains how to set up the PayCore database with Supabase and Drizzle ORM.

## Prerequisites

- A Supabase account (https://supabase.com)
- Bun installed (https://bun.sh)

## Step 1: Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in the project details:
   - **Name**: `paycore` (or your preferred name)
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
4. Wait for the project to be created

## Step 2: Get Connection Strings

1. In your Supabase project, go to **Project Settings** > **Database**
2. Copy the **Connection string** (URI format)
3. In **Project Settings** > **API**, copy:
   - `Project URL` (SUPABASE_URL)
   - `anon public` key (SUPABASE_ANON_KEY)
   - `service_role` key (SUPABASE_SERVICE_ROLE_KEY)

## Step 3: Configure Environment Variables

1. Copy the example environment file:

```bash
cd apps/api
cp .env.example .env.local
```

2. Edit `.env.local` with your Supabase credentials:

```env
# Database (from Step 2)
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

# Supabase (from Step 2)
SUPABASE_URL=https://[PROJECT_REF].supabase.co
SUPABASE_ANON_KEY=eyJhb...
SUPABASE_SERVICE_ROLE_KEY=eyJhb...
```

## Step 4: Run Migrations

### Option A: Using SQL Editor (Recommended for first setup)

1. Go to your Supabase project > **SQL Editor**
2. Copy and paste the contents of each migration file in order:
   - `supabase/migrations/0001_initial_schema.sql`
   - `supabase/migrations/0002_rls_policies.sql`
3. Run each script

### Option B: Using Drizzle CLI

```bash
# Generate migrations from schema (if you made changes)
bun run db:generate

# Push schema directly to database
bun run db:push

# Or run migrations
bun run db:migrate
```

## Step 5: Create Auth Users in Supabase

1. Go to your Supabase project > **Authentication** > **Users**
2. Click "Add User" > "Create new user"
3. Create the following test users:

| Email | Password | Notes |
|-------|----------|-------|
| admin@paycore.dev | (your choice) | Admin role |
| manager@paycore.dev | (your choice) | Manager role |
| user@paycore.dev | (your choice) | Regular user role |

## Step 6: Seed the Database

Run the seed script to create test data:

```bash
cd apps/api
bun run db:seed
```

This creates:
- 1 demo company
- 3 users (linked to auth users by email)
- 3 customers
- 5 invoices (various statuses)
- 6 invoice items
- 2 payments
- 1 debt case with activities

## Step 7: Verify Setup

1. Start the API server:

```bash
bun run dev:api
```

2. Test the health endpoint:

```bash
curl http://localhost:3002/health
```

3. Open Drizzle Studio to browse your data:

```bash
cd apps/api
bun run db:studio
```

## Database Commands Reference

| Command | Description |
|---------|-------------|
| `bun run db:generate` | Generate migrations from schema changes |
| `bun run db:push` | Push schema directly to database (dev only) |
| `bun run db:migrate` | Run pending migrations |
| `bun run db:studio` | Open Drizzle Studio (visual database browser) |
| `bun run db:seed` | Seed database with test data |

## Schema Overview

### Tables

| Table | Description |
|-------|-------------|
| `companies` | Multi-tenant organizations |
| `users` | Authenticated users (linked to Supabase Auth) |
| `customers` | Invoice recipients |
| `invoices` | Core billing documents |
| `invoice_items` | Line items for invoices |
| `payments` | Payment records |
| `debt_cases` | Debt recovery workflow |
| `debt_case_activities` | Activity log for debt cases |
| `audit_logs` | System activity tracking |

### Row Level Security (RLS)

All tables have RLS enabled with the following policies:
- Users can only access data from their own company
- Role-based permissions (admin, manager, user, readonly)
- Service role bypasses RLS for API operations

## Troubleshooting

### Connection Issues

If you see connection errors:

1. Check your `DATABASE_URL` is correct
2. Ensure SSL is enabled for production
3. Verify your IP is not blocked in Supabase

### Migration Errors

If migrations fail:

1. Check for existing tables that conflict
2. Run migrations in order (0001, 0002, etc.)
3. Use `bun run db:push` for development

### RLS Policy Errors

If you get permission denied:

1. Ensure the JWT contains `company_id` claim
2. Check the user has the correct role
3. Use service_role key for admin operations

## Production Considerations

1. **Connection Pooling**: Use Supabase's connection pooler for production
2. **Backups**: Enable Point-in-Time Recovery in Supabase
3. **Monitoring**: Set up database alerts in Supabase
4. **Secrets**: Never commit `.env.local` or credentials to git
