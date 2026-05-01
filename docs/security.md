# Security

## Environment variables
- All secrets in `.env.local` (gitignored)
- All env vars validated through `src/lib/env.ts` using Zod at startup
- Server-only secrets MUST NOT have `NEXT_PUBLIC_` prefix
- The app must crash at boot if a required env var is missing

Required env vars (so far):
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY (server only — NEVER expose to client)

## Input validation
- ALL user input validated with Zod before processing
- This includes: forms, API routes, Server Actions, URL params
- Never trust client-sent data, even from your own client

## Supabase
- Use `@supabase/ssr` for client + server setup
- Server actions use the service role key (carefully)
- Client uses anon key only
- Row Level Security (RLS) MUST be enabled on every table
- No table is public unless explicitly justified in an RLS policy

## Authentication (when added)
- Use Supabase Auth
- Verify session on every protected route via middleware
- Never store sensitive data in client-accessible cookies
- Use httpOnly cookies for session tokens

## Headers
- CSP headers configured in `next.config.ts`
- Strict-Transport-Security in production
- X-Content-Type-Options: nosniff
- Frame-Options: DENY (unless we explicitly need iframes)

## Rate limiting
- Required on any user-callable endpoint
- Use Upstash Ratelimit or Vercel's built-in rate limiting

## What we are protecting
- User-submitted emails (lead capture)
- Voice agent transcripts (will contain PII)
- Generated briefs (may contain proprietary research)
- Admin surfaces (will exist in v2)
