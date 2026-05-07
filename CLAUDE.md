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

`/revops/sales-insights` is the **Get Sales Insights micro-app**
(previously served at `/revops`, moved here on the
`feat/revops-lab-landing` branch so the lab landing could take over
`/revops`). Source-of-truth is unchanged:
`/docs/design-reference/revops-page.html`. The port lives at
`/src/app/revops/sales-insights/{page.tsx,page-styles.css,PageScripts.tsx}`
and follows the same direct-HTML-port workflow. The state machine
(CTA → email → cards → success) is implemented as React state in
`page.tsx`; only the aurora canvas + cursor spotlight remain in
`PageScripts.tsx`.

`/revops/voice-agent` is referenced from the lab landing's app-card
grid but is **not yet implemented** — the link 404s by design while
that micro-app is being built.

## When uncertain

Stop and ask. Do not guess on architecture, security, or convention
decisions. Reference the relevant doc and confirm.
