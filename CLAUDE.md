# S7 Labs — Project Constitution

## What is this?

A Next.js 16 application powering s7labs.ai, the innovation sub-brand of
System7 (an AI consultancy). The app is a multi-subdomain platform with
three labs: Creator, RevOps, and Build. Currently building v1: the public
landing page at the apex domain.

## Tech stack

- Next.js 16 (App Router, React 19)
- TypeScript (strict mode)
- Tailwind CSS v4
- Supabase (Postgres + Auth + Storage)
- Deployed to Vercel
- Node 22 LTS

## Project structure

See `/docs/architecture.md` for the full structure and rationale.

## Coding conventions

See `/docs/conventions.md`.

## Security rules (non-negotiable)

See `/docs/security.md`. Read this before writing any code that handles
user input, API requests, or environment variables.

## Testing

See `/docs/testing.md`.

## Commands

- `npm run dev` — local development
- `npm run build` — production build
- `npm run lint` — lint check
- `npm run typecheck` — TypeScript check (no emit)
- `npm test` — run unit tests (once vitest is installed)
- `npm run e2e` — run Playwright E2E tests (once installed)

## Always do

- Read all docs in /docs before starting a new feature
- Use Server Components by default; only use 'use client' when needed
- Validate all user input with Zod
- Use environment variables for ALL secrets, never inline
- Write tests for any non-trivial logic
- Follow file naming conventions in docs/conventions.md

## Never do

- Never commit secrets, .env files, or API keys
- Never use `any` in TypeScript (use `unknown` if truly needed)
- Never bypass auth checks "for now"
- Never write a Server Action without input validation
- Never disable ESLint rules without a comment explaining why
- Never install a new dependency without justifying it

## Landing page architecture note

The landing page at `/` is a direct port of the design produced by
Claude Design (saved at `/docs/design-reference/landing-page.html`).
It uses inline CSS and inline JavaScript wrapped in a Next.js page,
rather than the component architecture used elsewhere. This is
intentional:

- The design has visual nuance (aurora canvas blob math, oscilloscope
  rings, beam readouts, typewriter sequencers) that proved difficult
  to translate 1:1 into React components without visual drift.
- The marketing landing page is built once and rarely changes, so
  the maintenance cost of the inline approach is low.
- Inner pages (/creator, /intel/{company}, etc.) will use
  proper component architecture per /docs/conventions.md — the
  inline approach is specific to landing-style pages.

If the landing page needs changes, prefer regenerating from Claude
Design and re-porting, rather than incrementally editing the inline
CSS/JS.

## Shared header and footer

`/src/components/Header.tsx` and `/src/components/Footer.tsx` are
the canonical, sitewide header and footer. **All pages must import
and render these components** rather than duplicating the markup —
this rule supersedes the earlier "copy the header/footer verbatim"
guidance from the landing-page port. Co-located CSS lives at
`Header.css` / `Footer.css`. The `Footer` accepts an optional `lab`
prop (e.g. `<Footer lab="REVOPS" />` renders `S7 LABS · REVOPS`).
The `Header` accepts an optional `backHref` (defaults to
`https://www.system7.ai/`).

## /revops routes

`/revops` is the **RevOps Lab parent landing page** — a hub that
introduces the lab and links out to the individual micro-apps.
Source-of-truth is `/docs/design-reference/revops-lab-page.html`.
The port lives at `/src/app/revops/{page.tsx,page-styles.css,PageScripts.tsx}`.
`page.tsx` is a server component (the page is largely static); only
the aurora canvas + cursor spotlight live in `PageScripts.tsx`.
Header and footer come from the shared `<Header />` and `<Footer />`
components.

The **Get Sales Insights** and **Speak to Voice Agent** micro-apps now
live in the Live Apps marketplace (see "/live-apps routes" below), not
under `/revops`. The two app cards on the `/revops` hub link straight to
`/live-apps/sales-insights` and `/live-apps/voice-agent`. The old
`/revops/sales-insights` and `/revops/voice-agent` routes are kept as
thin `redirect()` stubs (`/src/app/revops/{sales-insights,voice-agent}/page.tsx`)
so existing links and bookmarks still resolve to the new home.

## /live-apps routes

`/live-apps` is the **Live Apps marketplace** — a gallery rendered from
the single `APPS` array in
`/src/app/live-apps/_data/apps.ts`. Each entry's `launch_url` points at
its route under `/live-apps/<id>`. The shared `live-apps/layout.tsx`
wraps every route and adds the "All live-apps" back-pill.

This route was renamed from `/mini-apps` to `/live-apps`. Three things
were deliberately **not** renamed and must stay as they are:

- The API namespace is still `/api/mini-apps/<slug>`.
- The Supabase `mini_apps` table and the `submissions.mini_app_slug` /
  `leads.first_source` columns keep their existing slug values, so all
  historical lead attribution stays intact. `slug-map.ts` maps DB slugs
  to `/live-apps/*` paths and is the single source of truth.
- Shared code directories (`src/components/mini-apps/`,
  `src/lib/mini-apps/`, `src/styles/mini-app-*.css`).

The permanent `/mini-apps/*` → `/live-apps/*` redirects in
`next.config.ts` must never be removed: result emails already delivered
contain absolute `/mini-apps/<slug>` links that cannot be edited.

`/live-apps/sales-insights` is the **Get Sales Insights micro-app** and
`/live-apps/voice-agent` is the **Speak to Voice Agent micro-app**, both
moved here from `/revops/*` on the `feat/revops-apps-to-mini-apps`
branch. Their ports are unchanged
(`{page.tsx,page-styles.css,PageScripts.tsx}`) and still POST to the
shared API route `/api/revops/sales-insights` (sales uses
`type: 'sales'`, voice uses `type: 'speak'`). Source-of-truth for both
remains `/docs/design-reference/revops-page.html` and the voice-agent
reference HTML.

## When uncertain

Stop and ask. Do not guess on architecture, security, or convention
decisions. Reference the relevant doc and confirm.
