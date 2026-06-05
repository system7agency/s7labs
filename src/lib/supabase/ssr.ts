import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Build a Supabase server client wired to Next.js Route Handler cookies().
 * Use from API routes and Route Handlers (not from middleware — that uses
 * its own helper below because the cookie surface is different).
 */
export async function createRouteHandlerClient() {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          // In Server Components / layouts, cookie writes are not allowed —
          // Next.js throws. The session refresh still happens in middleware,
          // so this is a safe no-op here. In Route Handlers and Server
          // Actions the write succeeds normally.
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            /* read-only cookie context */
          }
        },
      },
    }
  )
}

/**
 * Build a Supabase server client wired to middleware. Returns both the
 * client (for auth lookups) and a NextResponse that has any refreshed
 * cookies written to it — return this response from your middleware.
 */
export function createMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  return { supabase, response }
}
