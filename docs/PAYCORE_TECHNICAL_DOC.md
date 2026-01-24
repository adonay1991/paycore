# PayCore - Technical Documentation

**Version:** 1.0.0
**Date:** January 22, 2026
**Type:** Monorepo Architecture & Development Guide

---

## Table of Contents

1. [Overview](#1-overview)
2. [Monorepo Architecture](#2-monorepo-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Project Structure](#4-project-structure)
5. [Development Workflow](#5-development-workflow)
6. [Shared Packages](#6-shared-packages)
7. [Applications](#7-applications)
8. [TypeScript Configuration](#8-typescript-configuration)
9. [Code Quality & Tooling](#9-code-quality--tooling)
10. [Testing Strategy](#10-testing-strategy)
11. [Deployment](#11-deployment)
12. [Best Practices](#12-best-practices)

---

## 1. Overview

**PayCore** is a modern full-stack payment and debt recovery platform built as a Bun-powered monorepo. It leverages cutting-edge technologies including Next.js 16, React 19, Hono API, and Supabase to deliver a performant, type-safe, and scalable solution.

### Key Features

- **Bun-Native Monorepo**: Utilizes Bun's workspace protocol and dependency catalogs for zero-overhead package management
- **Modern Stack**: Next.js 16 (App Router) + React 19 + Hono + TypeScript 5.x
- **Type Safety**: End-to-end TypeScript with strict mode and shared types
- **Developer Experience**: Fast refresh, hot module reloading, and instant builds with Bun
- **Code Quality**: Ultracite (Biome-based) linting with automatic fixes

### Monorepo Goals

1. **Code Reusability**: Share types, components, and utilities across apps
2. **Consistency**: Unified tooling, linting, and TypeScript configuration
3. **Performance**: Bun's native speed for installs, tests, and builds
4. **Scalability**: Easy to add new apps or packages as the platform grows

---

## 2. Monorepo Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         PAYCORE MONOREPO                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │     WEB      │  │   PLATFORM   │  │     API      │         │
│  │  (Next.js)   │  │   (Next.js)  │  │    (Hono)    │         │
│  │   Port 3000  │  │   Port 3001  │  │   Port 3002  │         │
│  └───────┬──────┘  └───────┬──────┘  └───────┬──────┘         │
│          │                 │                  │                 │
│          └─────────────────┴──────────────────┘                 │
│                            │                                    │
│  ┌─────────────────────────┴─────────────────────────┐         │
│  │           SHARED PACKAGES (workspace:*)            │         │
│  ├────────────────┬──────────────────┬────────────────┤         │
│  │   @paycore/    │   @paycore/ui    │  @paycore/     │         │
│  │     types      │  (shadcn/ui)     │     utils      │         │
│  └────────────────┴──────────────────┴────────────────┘         │
│                                                                  │
│  ┌──────────────────────────────────────────────────┐          │
│  │        TOOLING (TypeScript Configs)              │          │
│  │  base.json | nextjs.json | api.json | library.json  │      │
│  └──────────────────────────────────────────────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼────┐         ┌────▼────┐        ┌────▼────┐
   │ Supabase│         │  Vercel  │        │ External│
   │PostgreSQL│        │   Edge   │        │   APIs  │
   │ Auth/RLS│         │ Functions│        │   ...   │
   └─────────┘         └──────────┘        └─────────┘
```

### Workspace Organization

```
paycore/
├── apps/                      # Application workspaces
│   ├── web/                   # Customer-facing app (Next.js 16)
│   ├── platform/              # Admin dashboard (Next.js 16)
│   └── api/                   # Backend API (Hono)
│
├── packages/                  # Shared packages
│   ├── types/                 # @paycore/types - Shared TypeScript types
│   ├── ui/                    # @paycore/ui - Component library (shadcn/ui)
│   └── utils/                 # @paycore/utils - Utility functions
│
├── tooling/                   # Development tooling
│   └── typescript/            # Shared TypeScript configurations
│
├── docs/                      # Documentation
├── package.json               # Root package with catalog
├── bunfig.toml                # Bun configuration
├── biome.jsonc                # Biome/Ultracite config
└── tsconfig.json              # Root TypeScript config
```

---

## 3. Technology Stack

### Core Technologies

| Technology | Version | Purpose | Documentation |
|------------|---------|---------|---------------|
| **Bun** | Latest | JavaScript runtime & package manager | [bun.sh](https://bun.sh) |
| **TypeScript** | 5.9+ | Type-safe JavaScript | [typescriptlang.org](https://www.typescriptlang.org) |
| **Next.js** | 16.x | React framework (App Router) | [nextjs.org](https://nextjs.org) |
| **React** | 19.2+ | UI library | [react.dev](https://react.dev) |
| **Hono** | 4.11+ | Fast web framework for API | [hono.dev](https://hono.dev) |

### Frontend Stack

| Package | Version | Purpose |
|---------|---------|---------|
| **Tailwind CSS** | 4.1+ | Utility-first CSS framework |
| **shadcn/ui** | Latest | Component library (Radix UI based) |
| **Radix UI** | 1.4+ | Unstyled, accessible UI primitives |
| **Class Variance Authority** | 0.7+ | Component variants |
| **Tailwind Merge** | 3.4+ | Merge Tailwind classes |
| **Phosphor Icons** | 2.1+ | Icon library |
| **Iconoir React** | 7.11+ | Alternative icon library |

### Backend Stack

| Package | Version | Purpose |
|---------|---------|---------|
| **Hono** | 4.11+ | Web framework |
| **Drizzle ORM** | 0.45+ | Type-safe ORM |
| **Drizzle Kit** | 0.31+ | Database migrations |
| **Postgres** | 3.4+ | PostgreSQL client |
| **@supabase/supabase-js** | 2.88+ | Supabase client library |

### Development Tools

| Tool | Purpose |
|------|---------|
| **Ultracite** | Biome-based linter (fast Rust-powered) |
| **Vitest** | Unit testing framework |
| **Bun Test** | Native Bun test runner |

---

## 4. Project Structure

### Complete Directory Tree

```
paycore/
│
├── apps/
│   ├── web/                           # Customer App (Next.js 16)
│   │   ├── src/
│   │   │   ├── app/                   # Next.js App Router
│   │   │   │   ├── layout.tsx         # Root layout
│   │   │   │   ├── page.tsx           # Home page
│   │   │   │   └── globals.css        # Global styles
│   │   │   ├── components/            # React components
│   │   │   └── lib/                   # App-specific utilities
│   │   ├── public/                    # Static assets
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── next.config.ts
│   │   └── tailwind.config.ts
│   │
│   ├── platform/                      # Admin Dashboard (Next.js 16)
│   │   ├── src/
│   │   │   ├── app/                   # Next.js App Router
│   │   │   ├── components/
│   │   │   └── lib/
│   │   ├── public/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── next.config.ts
│   │   └── tailwind.config.ts
│   │
│   └── api/                           # Backend API (Hono)
│       ├── src/
│       │   ├── index.ts               # Main entry point
│       │   ├── routes/                # API routes (empty, to be populated)
│       │   └── middleware/            # Custom middleware (empty, to be populated)
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── types/                         # @paycore/types
│   │   ├── src/
│   │   │   └── index.ts               # Exported types
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── ui/                            # @paycore/ui
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   └── ui/                # shadcn/ui components
│   │   │   ├── lib/
│   │   │   │   └── utils.ts           # cn() utility
│   │   │   ├── hooks/                 # Shared React hooks
│   │   │   └── index.ts               # Package exports
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── utils/                         # @paycore/utils
│       ├── src/
│       │   └── index.ts               # Utility functions
│       ├── package.json
│       └── tsconfig.json
│
├── tooling/
│   └── typescript/                    # Shared TypeScript configs
│       ├── base.json                  # Base config (strict mode)
│       ├── nextjs.json                # Next.js-specific
│       ├── api.json                   # Hono/Bun API config
│       └── library.json               # For shared packages
│
├── docs/                              # Project documentation
│   └── draft/                         # Draft documents
│
├── .claude/                           # Claude Code config
├── .vscode/                           # VS Code settings
├── package.json                       # Root package (catalogs)
├── bunfig.toml                        # Bun configuration
├── biome.jsonc                        # Linting config
├── tsconfig.json                      # Root TypeScript config
├── .gitignore
├── LICENSE
└── README.md
```

---

## 5. Development Workflow

### Initial Setup

```bash
# 1. Clone the repository
git clone <repository-url>
cd paycore

# 2. Install Bun (if not already installed)
curl -fsSL https://bun.sh/install | bash

# 3. Install all dependencies (uses Bun workspaces)
bun install

# 4. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# 5. Start development servers
bun dev  # Starts all apps concurrently
```

### Available Scripts

#### Root-Level Commands

```bash
# Development
bun dev                 # Start all apps (web:3000, platform:3001, api:3002)
bun dev:web             # Start customer app only (port 3000)
bun dev:platform        # Start admin dashboard only (port 3001)
bun dev:api             # Start API server only (port 3002)

# Building
bun run build           # Build all apps for production

# Code Quality
bun run lint            # Lint all code with Ultracite
bun run format          # Auto-fix linting and formatting issues

# Testing
bun test                # Run all tests with coverage
```

#### Individual App Commands

```bash
# Navigate to specific app
cd apps/web             # or apps/platform or apps/api

# Run app-specific commands
bun dev                 # Start this app only
bun build               # Build this app only
```

#### API Debugging

```bash
# Debug API server with Bun inspector
bun run debug           # Start with --inspect
bun run debug:brk       # Start with --inspect-brk (breaks on first line)
bun run debug:wait      # Start with --inspect-wait (waits for debugger)
```

### Development Ports

| App | Port | URL |
|-----|------|-----|
| Web (Customer) | 3000 | http://localhost:3000 |
| Platform (Admin) | 3001 | http://localhost:3001 |
| API (Backend) | 3002 | http://localhost:3002 |

---

## 6. Shared Packages

### 6.1 @paycore/types

**Purpose**: Centralized TypeScript type definitions shared across all apps.

**Location**: `packages/types/`

#### Current Exports

```typescript
// packages/types/src/index.ts

export interface User {
  id: string
  email: string
  name?: string
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}
```

#### Usage in Apps

```typescript
// In any app (web, platform, api)
import type { User, ApiResponse } from '@paycore/types'

const response: ApiResponse<User> = {
  data: {
    id: '1',
    email: 'user@example.com',
    name: 'John Doe'
  }
}
```

#### Adding New Types

```typescript
// packages/types/src/index.ts

export interface Invoice {
  id: string
  number: string
  amount: number
  dueDate: string
  status: 'pending' | 'paid' | 'overdue'
}

// Immediately available in all apps:
import type { Invoice } from '@paycore/types'
```

### 6.2 @paycore/ui

**Purpose**: Shared UI component library based on shadcn/ui with Radix UI primitives.

**Location**: `packages/ui/`

#### Package Structure

```
packages/ui/
├── src/
│   ├── components/
│   │   └── ui/               # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       └── ...
│   ├── lib/
│   │   └── utils.ts          # cn() utility for Tailwind
│   ├── hooks/                # Shared React hooks
│   ├── globals.css           # Global styles (Tailwind directives)
│   └── index.ts              # Package exports
```

#### Import Paths

```typescript
// Import UI components
import { Button } from '@paycore/ui/components/ui/button'
import { Card, CardHeader, CardContent } from '@paycore/ui/components/ui/card'

// Import utilities
import { cn } from '@paycore/ui/lib/utils'

// Import global styles (in app layout)
import '@paycore/ui/globals.css'
```

#### Adding shadcn/ui Components

```bash
# Navigate to UI package
cd packages/ui

# Add components using shadcn CLI
bunx shadcn@latest add button
bunx shadcn@latest add card dialog dropdown-menu

# Components are automatically added to src/components/ui/
```

#### Example Component

```typescript
// packages/ui/src/components/ui/button.tsx
import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
```

### 6.3 @paycore/utils

**Purpose**: Shared utility functions and helpers.

**Location**: `packages/utils/`

#### Current Structure

```
packages/utils/
├── src/
│   └── index.ts          # Utility functions
├── package.json          # No build step (TypeScript only)
└── tsconfig.json
```

#### Example Utilities

```typescript
// packages/utils/src/index.ts

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
  }).format(amount)
}

/**
 * Format date
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d)
}

/**
 * Validate Spanish VAT number (NIF/CIF)
 */
export function isValidVAT(vat: string): boolean {
  const pattern = /^[ABCDEFGHJNPQRSUVW]\d{8}$/
  return pattern.test(vat)
}
```

#### Usage

```typescript
import { formatCurrency, formatDate, isValidVAT } from '@paycore/utils'

const price = formatCurrency(1250.50)  // "1.250,50 €"
const date = formatDate(new Date())    // "22 de enero de 2026"
const valid = isValidVAT('B12345678')  // true
```

---

## 7. Applications

### 7.1 Web App (Customer-Facing)

**Location**: `apps/web/`
**Port**: 3000
**Framework**: Next.js 16 (App Router) + React 19

#### Key Features

- Customer portal for debt information
- Invoice viewing and payment
- Communication history
- Responsive, mobile-first design

#### Stack

```json
{
  "dependencies": {
    "next": "catalog:",
    "react": "catalog:",
    "react-dom": "catalog:",
    "@paycore/types": "workspace:*",
    "@paycore/ui": "workspace:*",
    "@paycore/utils": "workspace:*"
  }
}
```

#### Next.js 16 Requirements

**Critical**: Next.js 16 requires `await` for `params` and `searchParams`:

```typescript
// app/invoices/[id]/page.tsx
export default async function InvoicePage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  // MUST await params and searchParams
  const { id } = await params
  const { tab } = await searchParams

  // Now you can use them
  const invoice = await fetchInvoice(id)

  return (
    <div>
      <h1>Invoice {invoice.number}</h1>
      {tab === 'details' && <InvoiceDetails invoice={invoice} />}
    </div>
  )
}
```

### 7.2 Platform App (Admin Dashboard)

**Location**: `apps/platform/`
**Port**: 3001
**Framework**: Next.js 16 (App Router) + React 19

#### Key Features

- Debt management dashboard
- Task assignment and tracking
- Analytics and reporting
- User and role management

#### Stack

Same as Web App (Next.js 16 + shared packages)

### 7.3 API App (Backend)

**Location**: `apps/api/`
**Port**: 3002
**Framework**: Hono (Web framework for Bun)

#### Architecture

```typescript
// apps/api/src/index.ts
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'

const app = new Hono()

// Global middleware
app.use('*', logger())
app.use('*', cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}))

// Health check
app.get('/', (c) => {
  return c.json({ message: 'PayCore API is running' })
})

// Future routes will be added here
// import usersRouter from './routes/users'
// app.route('/api/users', usersRouter)

// Error handling
app.onError((err, c) => {
  console.error('Error:', err)
  return c.json({
    error: err.message,
    message: 'Internal Server Error'
  }, 500)
})

// Start server with Bun
export default {
  port: 3002,
  fetch: app.fetch,
}
```

#### Building and Running

```bash
# Development (with hot reload)
bun dev

# Build for production
bun run build  # Output: dist/index.js

# Run production build
bun start  # Runs dist/index.js
```

#### Adding Routes

```typescript
// apps/api/src/routes/users.ts
import { Hono } from 'hono'
import type { User } from '@paycore/types'

const usersRouter = new Hono()

usersRouter.get('/', async (c) => {
  // Fetch users from database
  const users: User[] = []  // TODO: Implement
  return c.json(users)
})

usersRouter.get('/:id', async (c) => {
  const id = c.req.param('id')
  // Fetch user by ID
  const user: User | null = null  // TODO: Implement
  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }
  return c.json(user)
})

export default usersRouter
```

```typescript
// apps/api/src/index.ts
import usersRouter from './routes/users'

// Register route
app.route('/api/users', usersRouter)
```

---

## 8. TypeScript Configuration

### 8.1 Configuration Hierarchy

```
Root tsconfig.json (base references)
│
├── tooling/typescript/base.json (strict settings)
│   │
│   ├── tooling/typescript/nextjs.json (Next.js specific)
│   │   ├── apps/web/tsconfig.json
│   │   └── apps/platform/tsconfig.json
│   │
│   ├── tooling/typescript/api.json (Bun/Hono specific)
│   │   └── apps/api/tsconfig.json
│   │
│   └── tooling/typescript/library.json (Package specific)
│       ├── packages/types/tsconfig.json
│       ├── packages/ui/tsconfig.json
│       └── packages/utils/tsconfig.json
```

### 8.2 Base Configuration

```json
// tooling/typescript/base.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "checkJs": false,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true
  }
}
```

### 8.3 Next.js Configuration

```json
// tooling/typescript/nextjs.json
{
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["DOM", "DOM.Iterable", "ES2023"],
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 8.4 API Configuration

```json
// tooling/typescript/api.json
{
  "extends": "./base.json",
  "compilerOptions": {
    "types": ["bun-types"],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

---

## 9. Code Quality & Tooling

### 9.1 Ultracite (Biome-Based Linting)

**Ultracite** is a Biome preset configured in `biome.jsonc` that provides fast, Rust-powered linting and formatting.

```jsonc
// biome.jsonc
{
  "extends": [
    "ultracite/core",      // Core rules
    "ultracite/react",     // React-specific rules
    "ultracite/next"       // Next.js-specific rules
  ],
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  }
}
```

#### Commands

```bash
# Check for issues (lint only)
bun run lint

# Auto-fix all issues
bun run format
```

### 9.2 Key Patterns Enforced

- **TypeScript strict mode**: No implicit `any`, strict null checks
- **Explicit types**: Function parameters and return types must be typed
- **No `any` types**: Use `unknown` with validation instead
- **React hooks rules**: Hooks only at top level, correct dependency arrays
- **Next.js 16 patterns**: Async params/searchParams

---

## 10. Testing Strategy

### 10.1 Test Configuration

```toml
# bunfig.toml
[test]
preload = ["./test/setup.ts"]
coverage = true
coverageDir = "./coverage"
coverageReporter = ["text", "lcov"]
```

### 10.2 Running Tests

```bash
# Run all tests
bun test

# Run tests with coverage
bun test --coverage

# Watch mode
bun test --watch
```

### 10.3 Example Test

```typescript
// packages/utils/src/index.test.ts
import { describe, it, expect } from 'bun:test'
import { formatCurrency, isValidVAT } from './index'

describe('formatCurrency', () => {
  it('should format EUR currency correctly', () => {
    expect(formatCurrency(1000)).toBe('1.000,00 €')
    expect(formatCurrency(1250.50)).toBe('1.250,50 €')
  })
})

describe('isValidVAT', () => {
  it('should validate Spanish VAT numbers', () => {
    expect(isValidVAT('B12345678')).toBe(true)
    expect(isValidVAT('A98765432')).toBe(true)
    expect(isValidVAT('12345678')).toBe(false)
    expect(isValidVAT('B123456')).toBe(false)
  })
})
```

---

## 11. Deployment

### 11.1 Vercel Deployment (Recommended)

#### Configuration

```json
// vercel.json (root)
{
  "buildCommand": "bun run build",
  "installCommand": "bun install",
  "framework": "nextjs",
  "functions": {
    "apps/api/src/index.ts": {
      "runtime": "bun@1"
    }
  }
}
```

#### Environment Variables

Configure in Vercel Dashboard:

```bash
# Supabase (Public)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# API Keys (Server-only)
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ELEVENLABS_API_KEY=sk-...

# Database
DATABASE_URL=postgresql://...
```

### 11.2 Build Process

```bash
# Build all apps
bun run build

# Outputs:
# - apps/web/.next/
# - apps/platform/.next/
# - apps/api/dist/index.js
```

---

## 12. Best Practices

### 12.1 Bun Monorepo Best Practices

#### Dependency Management

```json
// ✅ GOOD: Use catalog for shared dependencies
{
  "dependencies": {
    "react": "catalog:",
    "next": "catalog:"
  }
}

// ✅ GOOD: Use workspace:* for local packages
{
  "dependencies": {
    "@paycore/types": "workspace:*"
  }
}

// ❌ BAD: Hardcode versions (creates inconsistency)
{
  "dependencies": {
    "react": "^19.2.3"
  }
}
```

#### Adding Dependencies

```bash
# Add to catalog (shared across workspaces)
# 1. Edit root package.json catalog
# 2. Reference with "catalog:" in workspace

# Add workspace-specific dependency
cd apps/web
bun add some-package
```

### 12.2 TypeScript Best Practices

#### No `any` Types

```typescript
// ❌ BAD: Using any
function processData(data: any) {
  return data.value
}

// ✅ GOOD: Use unknown with validation
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return data.value
  }
  throw new Error('Invalid data')
}

// ✅ BETTER: Use proper types
import type { DataType } from '@paycore/types'

function processData(data: DataType) {
  return data.value
}
```

#### Type Sharing

```typescript
// ✅ GOOD: Define types in @paycore/types
// packages/types/src/index.ts
export interface Invoice {
  id: string
  amount: number
}

// Use in apps
import type { Invoice } from '@paycore/types'
```

### 12.3 Next.js 16 Best Practices

#### Server vs Client Components

```typescript
// ✅ Server Component (default) - NO 'use client'
// app/invoices/page.tsx
export default async function InvoicesPage() {
  // Can directly fetch data
  const invoices = await fetchInvoices()
  return <InvoiceList invoices={invoices} />
}

// ✅ Client Component - NEEDS 'use client'
// components/invoice-filters.tsx
'use client'

export function InvoiceFilters({ onChange }: Props) {
  const [filter, setFilter] = useState('')
  // Interactive client logic
}
```

#### Await Params and SearchParams

```typescript
// ✅ CORRECT: Await params
export default async function Page({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { id } = await params
  const { tab } = await searchParams
  // ...
}

// ❌ WRONG: Direct destructuring (will error)
export default async function Page({
  params: { id }  // ERROR in Next.js 16
}) {
  // ...
}
```

### 12.4 Hono API Best Practices

#### Route Organization

```typescript
// ✅ GOOD: Separate route files
// src/routes/users.ts
import { Hono } from 'hono'

const usersRouter = new Hono()

usersRouter.get('/', async (c) => { /* ... */ })
usersRouter.post('/', async (c) => { /* ... */ })

export default usersRouter

// src/index.ts
import usersRouter from './routes/users'
app.route('/api/users', usersRouter)
```

#### Error Handling

```typescript
// ✅ GOOD: Structured error responses
app.onError((err, c) => {
  console.error('Error:', err)

  if (err instanceof ValidationError) {
    return c.json({
      error: 'Validation failed',
      details: err.details
    }, 400)
  }

  return c.json({
    error: 'Internal Server Error',
    message: err.message
  }, 500)
})
```

### 12.5 Git Workflow

#### Commit Message Format

Following Conventional Commits:

```bash
# Format: type(scope): description

feat(api): add user authentication endpoint
fix(web): resolve invoice display bug
docs: update API documentation
chore(deps): update dependencies
refactor(types): simplify User interface
```

#### Branch Strategy

```bash
# Feature branches
git checkout -b feature/user-auth
git checkout -b fix/invoice-bug

# Commit and push
git commit -m "feat(api): add JWT authentication"
git push origin feature/user-auth
```

---

## Appendix A: Environment Variables

### Required Variables

```bash
# .env.local (all apps)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# API Keys (server-side only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
ELEVENLABS_API_KEY=sk_...

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
```

---

## Appendix B: Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "Module not found: @paycore/types" | Workspace not linked | Run `bun install` at root |
| "Type error: params is Promise<...>" | Not awaiting params | Add `const { id } = await params` |
| "Port 3000 already in use" | Previous dev server running | Kill process: `lsof -ti:3000 \| xargs kill -9` |
| "Hydration mismatch" | Server/client state diff | Use `'use client'` or dynamic import |
| Bun install fails | Cache corruption | Clear cache: `rm -rf ~/.bun/install/cache` |

---

**Document Version**: 1.0.0
**Last Updated**: January 22, 2026
**Monorepo**: PayCore
**Maintainer**: Development Team
