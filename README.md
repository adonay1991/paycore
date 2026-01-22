# paycore

A Next.js + Hono monorepo scaffolded with bunkit.

## Getting Started

```bash
# Install all dependencies
bun install

# Start all apps in development
bun dev

# Build all apps
bun run build
```

## Demo

After starting with `bun dev`, visit:
- [http://localhost:3000](http://localhost:3000) - Customer app
- [http://localhost:3001](http://localhost:3001) - Admin dashboard
- [http://localhost:3002](http://localhost:3002) - API server

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
| `bun dev` | Start all apps |
| `bun run dev:web` | Start customer app (3000) |
| `bun run dev:platform` | Start admin dashboard (3001) |
| `bun run dev:api` | Start API server |
| `bun run build` | Build all apps |
| `bun run lint` | Lint all code |

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


---

## Author

**paycore** was created by you using [bunkit](https://github.com/Arakiss/bunkit).

## License

This project is yours to use however you want. Consider adding a license file (MIT, Apache, etc.) to clarify usage terms for others.

---

<p align="center">
  <sub>Scaffolded with <a href="https://github.com/Arakiss/bunkit">bunkit</a> 🍞 | 2026</sub>
</p>
