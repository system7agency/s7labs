'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export function SignOutButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const handleClick = async () => {
    setBusy(true)
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.replace('/insights/login')
    router.refresh()
  }

  return (
    <button type="button" className="ins-signout" onClick={handleClick} disabled={busy}>
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  )
}
