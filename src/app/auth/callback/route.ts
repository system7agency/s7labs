import { NextResponse } from 'next/server'

import { createRouteHandlerClient } from '@/lib/supabase/ssr'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Magic-link callback. Supabase redirects here with ?code=... after the
 * user clicks the email link. We exchange the code for a session (sets
 * the auth cookies) and then forward to /insights (or the ?next= param).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/insights'

  if (code) {
    const supabase = await createRouteHandlerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
    console.error('[auth/callback] exchangeCodeForSession failed', error.message)
  }

  return NextResponse.redirect(`${origin}/insights/login?error=auth_failed`)
}
