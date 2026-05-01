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

## When uncertain

Stop and ask. Do not guess on architecture, security, or convention
decisions. Reference the relevant doc and confirm.
