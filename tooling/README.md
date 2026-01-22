# Tooling

Shared configuration files for the monorepo.

## TypeScript Configurations

- `base.json` - Base TypeScript configuration
- `nextjs.json` - Configuration for Next.js applications
- `api.json` - Configuration for API/Hono services
- `library.json` - Configuration for shared packages/libraries

## Usage

Extend these configurations in your workspace `tsconfig.json`:

```json
{
  "extends": "../../tooling/typescript/nextjs.json",
  "compilerOptions": {
    // Override specific options if needed
  }
}
```
