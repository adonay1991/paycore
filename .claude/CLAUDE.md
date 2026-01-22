# Ultracite Code Standards

This project uses **Ultracite**, a zero-config Biome preset that enforces strict code quality standards through automated formatting and linting.

## Quick Reference

- **Format code**: `bun run format` or `npx ultracite fix`
- **Check for issues**: `bun run lint` or `npx ultracite check`
- **Diagnose setup**: `npx ultracite doctor`

Biome (the underlying engine) provides extremely fast Rust-based linting and formatting. Most issues are automatically fixable.

---

## Core Principles

Write code that is **accessible, performant, type-safe, and maintainable**. Focus on clarity and explicit intent over brevity.

### Type Safety & Explicitness

- Use explicit types for function parameters and return values when they enhance clarity
- Prefer `unknown` over `any` when the type is genuinely unknown
- Use const assertions (`as const`) for immutable values and literal types
- Leverage TypeScript's type narrowing instead of type assertions
- Use meaningful variable names instead of magic numbers - extract constants with descriptive names
- **TypeScript strictness**: strict mode

### Modern JavaScript/TypeScript

- Use arrow functions for callbacks and short functions
- Prefer `for...of` loops over `.forEach()` and indexed `for` loops
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safer property access
- Prefer template literals over string concatenation
- Use destructuring for object and array assignments
- Use `const` by default, `let` only when reassignment is needed, never `var`

### Async & Promises

- Always `await` promises in async functions - don't forget to use the return value
- Use `async/await` syntax instead of promise chains for better readability
- Handle errors appropriately in async code with try-catch blocks
- Don't use async functions as Promise executors

### React & JSX

- Use function components over class components
- Call hooks at the top level only, never conditionally
- Specify all dependencies in hook dependency arrays correctly
- Use the `key` prop for elements in iterables (prefer unique IDs over array indices)
- Nest children between opening and closing tags instead of passing as props
- Don't define components inside other components
- Use semantic HTML and ARIA attributes for accessibility

### Next.js Specific

- Use Next.js `<Image>` component for images
- Use Server Components for async data fetching
- Always `await params` and `await searchParams` in Next.js 16
- Add `'use client'` only when needed

### Variable Naming (CRITICAL)

❌ NEVER use: `c`, `ctx`, `e`, `req`, `res`, `data`, `temp`
✅ ALWAYS use: `context`, `error`, `request`, `response`, `userData`, `temporaryBuffer`

## Tech Stack

- **Runtime**: Bun
- **Framework**: Next.js 16 + React 19
- **Styling**: Tailwind CSS 4
- **Database**: supabase-drizzle
- **UI**: shadcn/ui
- **Code Quality**: Ultracite (Biome)
- **Testing**: bun-test
