# PayCore

[![CI](https://github.com/YOUR_USERNAME/paycore/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/paycore/actions/workflows/ci.yml)
[![Deploy](https://github.com/YOUR_USERNAME/paycore/actions/workflows/deploy.yml/badge.svg)](https://github.com/YOUR_USERNAME/paycore/actions/workflows/deploy.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue.svg)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.3+-f9f1e1.svg)](https://bun.sh)

A modern payment and debt recovery platform built as a Bun-powered monorepo with Next.js 16, React 19, Hono API, and Supabase.

📚 **[Complete Technical Documentation](./docs/PAYCORE_TECHNICAL_DOC.md)**

## Quick Start

```bash
# 1. Install Bun (if not already installed)
curl -fsSL https://bun.sh/install | bash

# 2. Install all dependencies
bun install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# 4. Start all apps in development
bun dev

# 5. Build all apps for production
bun run build
```

## Development Servers

After starting with `bun dev`, visit:

| App | Port | URL | Description |
|-----|------|-----|-------------|
| **Web** | 3000 | http://localhost:3000 | Customer-facing portal |
| **Platform** | 3001 | http://localhost:3001 | Admin dashboard |
| **API** | 3002 | http://localhost:3002 | Hono backend API |

## Project Structure

```
paycore/
apps/
├── web/              # Customer-facing Next.js app (port 3000)
├── platform/         # Admin dashboard (port 3001)
└── api/              # Hono API server

packages/
├── types/            # Shared TypeScript types
├── utils/            # Shared utilities
└── ui/               # Shared shadcn/ui components

tooling/
└── typescript/       # Shared TypeScript configurations

package.json          # Root with Bun dependency catalogs
bunfig.toml
tsconfig.json
```

## Scripts

| Script | Description |
|--------|-------------|
| `bun dev` | Start all apps concurrently |
| `bun run dev:web` | Start customer app only (port 3000) |
| `bun run dev:platform` | Start admin dashboard only (port 3001) |
| `bun run dev:api` | Start API server only (port 3002) |
| `bun run build` | Build all apps for production |
| `bun run lint` | Lint all code with Ultracite |
| `bun run format` | Auto-fix linting and formatting |
| `bun test` | Run tests with coverage |
| `bun run debug` | Debug API server with inspector |

## Bun Monorepo Features

This project uses Bun 1.3+ monorepo features:

### Dependency Catalogs

Centralized versions in root `package.json`:

```json
{
  "catalog": {
    "react": "^19.2.3",
    "next": "^16.0.10"
  }
}
```

Reference in workspace packages:

```json
{
  "dependencies": {
    "react": "catalog:"
  }
}
```

### Workspace Protocol

Link local packages:

```json
{
  "dependencies": {
    "@paycore/types": "workspace:*"
  }
}
```

## Adding Workspaces

```bash
# Add a new app
bunkit add workspace --name apps/docs --preset nextjs

# Add a shared package
bunkit add package --name @paycore/email --type library
```

## Adding shadcn/ui Components

```bash
# Components go to packages/ui
cd packages/ui
bunx shadcn@latest add button card dialog
```

Import in apps:
```typescript
import { Button } from '@paycore/ui/components/ui/button';
```

## Deployment

### API (Fly.io)

```bash
# Deploy API to Fly.io
cd apps/api
fly deploy
```

### Frontends (Vercel)

```bash
# Deploy via Vercel CLI
vercel --prod
```

### CI/CD

The project includes GitHub Actions workflows:

- **CI Pipeline** (`.github/workflows/ci.yml`): Runs on every push/PR
  - Linting with Ultracite
  - Type checking
  - Unit and integration tests
  - Build verification

- **Deploy Pipeline** (`.github/workflows/deploy.yml`): Deploys on main branch
  - Database migrations
  - API deployment to Fly.io
  - Frontend deployments to Vercel

## Technology Stack

- **Runtime**: Bun (fast JavaScript runtime & package manager)
- **Frontend**: Next.js 16 (App Router) + React 19
- **Backend**: Hono (fast web framework)
- **Database**: Supabase (PostgreSQL + Auth + Realtime)
- **ORM**: Drizzle ORM (type-safe)
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **Linting**: Ultracite (Biome-based, Rust-powered)
- **Testing**: Bun Test (171 tests passing)
- **TypeScript**: 5.9+ with strict mode
- **CI/CD**: GitHub Actions + Docker
- **Deployment**: Vercel (frontends) + Fly.io (API)

## Features

### Core Platform

- **Multi-tenant Architecture**: Company-based data isolation with Supabase RLS
- **Role-Based Access Control**: Admin, Manager, Collector, Viewer roles with granular permissions
- **Invoice Management**: Create, track, and manage customer invoices with automatic calculations
- **Payment Processing**: Record payments, track partial payments, reconciliation
- **Debt Collection Workflow**: Automated debt case creation, status tracking, aging reports
- **Customer Portal**: Self-service portal for customers to view invoices and make payments

### Technical Features

- **Type-Safe API**: Zod validation schemas with automatic TypeScript inference
- **Real-time Updates**: Supabase real-time subscriptions for live data
- **Optimistic UI**: React 19 with optimistic updates and transitions
- **Performance Optimized**: Next.js package imports optimization, image optimization, compression
- **Security Headers**: HSTS, X-Frame-Options, CSP-ready configuration
- **Comprehensive Testing**: Unit, integration, and component tests with coverage

## Documentation

📚 **[Documentation Hub](./docs/README.md)** - Complete documentation index

### Quick Links

- ⚡ **[Quick Start Guide](./docs/QUICK_START_GUIDE.md)** - Get started in 5 minutes
- 📘 **[Technical Documentation](./docs/PAYCORE_TECHNICAL_DOC.md)** - Complete system guide
- 🗄️ **[Data Architecture](./docs/DATA_ARCHITECTURE.md)** - Database & API patterns
- 🎯 **[Best Practices](./docs/PAYCORE_TECHNICAL_DOC.md#12-best-practices)** - Coding standards

### By Topic

- [Monorepo Architecture](./docs/PAYCORE_TECHNICAL_DOC.md#2-monorepo-architecture)
- [Shared Packages (@paycore/*)](./docs/PAYCORE_TECHNICAL_DOC.md#6-shared-packages)
- [Database Setup](./docs/QUICK_START_GUIDE.md#database-setup-with-drizzle-orm)
- [Supabase Integration](./docs/QUICK_START_GUIDE.md#supabase-integration)
- [Deployment Guide](./docs/PAYCORE_TECHNICAL_DOC.md#11-deployment)

---

## Author

**paycore** was created by you using [bunkit](https://github.com/Arakiss/bunkit).

## License

This project is yours to use however you want. Consider adding a license file (MIT, Apache, etc.) to clarify usage terms for others.

---

<p align="center">
  <sub>Scaffolded with <a href="https://github.com/Arakiss/bunkit">bunkit</a> 🍞 | 2026</sub>
</p>
