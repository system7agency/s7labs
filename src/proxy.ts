import { NextRequest, NextResponse } from 'next/server'

import { isAllowed } from '@/lib/insights/allowlist'
import { createMiddlewareClient } from '@/lib/supabase/ssr'

/**
 * Gate /insights/* behind Supabase Auth + the allowlist.
 *
 * - No session → redirect to /insights/login
 * - Session present but email not allowlisted → sign out, redirect to login with error
 * - Session present and allowlisted → pass through
 *
 * /insights/login is exempt so we don't loop.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname === '/insights/login' || pathname.startsWith('/insights/login/')) {
    return NextResponse.next()
  }

  const { supabase, response } = createMiddlewareClient(request)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/insights/login'
    url.search = ''
    return NextResponse.redirect(url)
  }

  if (!isAllowed(user.email)) {
    await supabase.auth.signOut()
    const url = request.nextUrl.clone()
    url.pathname = '/insights/login'
    url.search = '?error=not_authorized'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/insights/:path*'],
}
