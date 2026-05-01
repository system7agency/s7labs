# Code Conventions

## File naming

- Components: PascalCase, one component per file: `RouteCard.tsx`
- Utilities: kebab-case: `format-date.ts`
- Hooks: camelCase with `use` prefix: `useScrollProgress.ts`
- Types: kebab-case: `lab-types.ts`
- Tests: same name as the file being tested with `.test.ts(x)` suffix

## TypeScript

- `strict: true` is mandatory
- No `any` — use `unknown` and narrow with type guards
- Prefer `type` over `interface` unless you need declaration merging
- Export types from a `types/` file when shared, co-locate when not
- Use `as const` for literal type narrowing

## React patterns

- Server Components by default
- Add `'use client'` directive only when the component needs:
  - State (useState)
  - Effects (useEffect)
  - Event handlers (onClick, onChange)
  - Browser APIs (window, document)
- Do NOT add 'use client' "just in case"
- Pass server data into client components via props, not via fetching twice

## Component structure

```tsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import type { Lab } from '@/types/lab-types'

type Props = { lab: Lab }

export function RouteCard({ lab }: Props) {
  return (...)
}
```

## Tailwind

- Use Tailwind utilities; avoid custom CSS unless impossible in Tailwind
- Group classes by category (layout, spacing, typography, color, effects)
- Extract repeated patterns into a component, not into a CSS class
- Use the `cn()` utility (clsx + tailwind-merge) for conditional classes

## Imports

- Use absolute imports via `@/` alias
- Group: external libs first, then internal `@/`, then relative, then types
- One blank line between groups

## Server Actions

- Always validate inputs with Zod
- Always check auth (when auth exists)
- Return typed results, never throw raw errors to client
- Use `'use server'` at the top of the function or file

## API routes

- Use only when Server Actions don't fit (webhooks, third-party callbacks)
- Always validate request bodies with Zod
- Always return typed JSON responses
- Use proper HTTP status codes
