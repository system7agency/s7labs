# S7 Labs

The innovation sub-brand of System7. Multi-lab platform at s7labs.ai.

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in values
npm run dev
```

Open http://localhost:3000.

## Documentation

All architecture, conventions, security, and testing rules live in `/docs`.
Start with `CLAUDE.md` for an overview, then read the doc relevant to what
you're working on.

## Tech stack

Next.js 16 · TypeScript · Tailwind v4 · Supabase · Vercel

## Scripts

- `npm run dev` — local development server
- `npm run build` — production build
- `npm run start` — run production build locally
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript no-emit check
- `npm test` — Vitest unit tests
- `npm run e2e` — Playwright E2E tests

## Deployment

Pushes to `main` deploy to production via Vercel.
PRs get preview deploys automatically.
