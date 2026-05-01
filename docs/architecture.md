# Architecture

## Folder structure

s7labs/
├── src/
│ ├── app/ # App Router pages and layouts
│ │ ├── (marketing)/ # Public marketing pages (landing)
│ │ ├── api/ # API routes (REST endpoints)
│ │ ├── layout.tsx # Root layout
│ │ └── page.tsx # Landing page
│ ├── components/ # Shared React components
│ │ ├── ui/ # Primitive UI (buttons, inputs)
│ │ ├── layout/ # Header, footer, etc.
│ │ └── features/ # Feature-specific components
│ ├── lib/ # Shared utilities and clients
│ │ ├── supabase/ # Supabase client setup
│ │ ├── utils.ts # Generic utilities
│ │ └── env.ts # Validated env vars
│ ├── hooks/ # Custom React hooks
│ ├── types/ # Shared TypeScript types
│ └── styles/ # Global CSS
├── docs/ # Documentation (read by Claude Code)
├── tests/ # E2E tests (Playwright)
├── public/ # Static assets
└── [config files]

## Why this structure

- `src/` keeps source separate from config
- Route groups like `(marketing)` allow shared layouts without affecting URLs
- `components/ui/` vs `components/features/` separates primitives from
  business logic
- `lib/` is for things that aren't components (clients, utilities, schemas)
- `types/` centralizes shared types — feature types live with the feature

## Routing strategy

- App Router only
- Subdomains handled via Next.js middleware (later, when we build inner pages)
- Marketing pages in `(marketing)` route group
- API routes for server-only operations
- Server Actions preferred over API routes for form submissions

## Rendering strategy

- Server Components by default
- 'use client' only when interaction or browser APIs are needed
- Streaming with Suspense for slow data fetching
- Static generation where possible (the landing page IS static)
