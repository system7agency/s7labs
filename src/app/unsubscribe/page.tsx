import Link from 'next/link'

import { getSupabaseServerClient } from '@/lib/supabase/server'

import { ConfirmButton } from './ConfirmButton'
import styles from './unsubscribe.module.css'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'Unsubscribe · S7 Labs',
  description: 'Manage your S7 Labs marketing email preferences.',
}

type LeadRow = {
  id: string
  email: string
  marketing_consent: boolean
  unsubscribed_at: string | null
}

type LookupResult = { ok: true; lead: LeadRow } | { ok: false }

function redactEmail(email: string): string {
  const at = email.indexOf('@')
  if (at < 1) return email
  const local = email.slice(0, at)
  const domain = email.slice(at + 1)
  if (local.length <= 1) {
    return `•••@${domain}`
  }
  return `${local[0]}••@${domain}`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

async function lookupLead(token: string): Promise<LookupResult> {
  if (!token || token.length > 128) return { ok: false }
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from('leads')
    .select('id, email, marketing_consent, unsubscribed_at')
    .eq('unsubscribe_token', token)
    .maybeSingle()
  if (error) {
    console.error('[unsubscribe page] lookup error', error.message)
    return { ok: false }
  }
  if (!data) return { ok: false }
  return { ok: true, lead: data as LeadRow }
}

async function resubscribeLead(leadId: string): Promise<boolean> {
  const supabase = getSupabaseServerClient()
  const nowIso = new Date().toISOString()
  const { error } = await supabase
    .from('leads')
    .update({
      unsubscribed_at: null,
      marketing_consent: true,
      marketing_consent_at: nowIso,
      marketing_consent_source: 'resubscribe_page',
    })
    .eq('id', leadId)
  if (error) {
    console.error('[unsubscribe page] resubscribe error', error.message)
    return false
  }
  return true
}

function Shell({ monoLabel, children }: { monoLabel: string; children: React.ReactNode }) {
  return (
    <main className={styles.page}>
      <div className={styles.cardWrap}>
        <section className={styles.card}>
          <span className={styles.cornerTopRight} aria-hidden="true" />
          <span className={styles.cornerBottomLeft} aria-hidden="true" />
          <span className={styles.monoLabel}>{monoLabel}</span>
          {children}
        </section>
      </div>
    </main>
  )
}

function FooterLink() {
  return (
    <Link href="https://s7labs.ai" className={styles.footerLink}>
      Changed your mind? Go back to s7labs.ai →
    </Link>
  )
}

function InvalidState() {
  return (
    <Shell monoLabel="// UNSUBSCRIBE · INVALID">
      <h1 className={styles.heading}>This unsubscribe link isn&apos;t valid.</h1>
      <p className={styles.body}>
        It may have expired or been mistyped. If you keep getting emails you don&apos;t want, reply
        to any of them and we&apos;ll handle it manually.
      </p>
      <FooterLink />
    </Shell>
  )
}

function ConfirmState({ token, email }: { token: string; email: string }) {
  return (
    <Shell monoLabel="// UNSUBSCRIBE · CONFIRM">
      <h1 className={styles.heading}>Unsubscribe from S7 Labs</h1>
      <p className={styles.body}>
        You&apos;re about to unsubscribe{' '}
        <span className={styles.emailRedacted}>{redactEmail(email)}</span>. We won&apos;t send you
        any more product updates.
      </p>
      <ConfirmButton token={token} />
      <FooterLink />
    </Shell>
  )
}

function SuccessState({ token }: { token: string }) {
  return (
    <Shell monoLabel="// UNSUBSCRIBE · DONE">
      <h1 className={styles.heading}>You&apos;re unsubscribed.</h1>
      <p className={styles.body}>We won&apos;t send you marketing emails anymore. ✌️</p>
      <Link
        href={`/unsubscribe?token=${encodeURIComponent(token)}&resubscribe=true`}
        className={styles.resubLink}
      >
        Made a mistake? Re-subscribe here →
      </Link>
      <FooterLink />
    </Shell>
  )
}

function AlreadyUnsubscribedState({
  token,
  unsubscribedAt,
}: {
  token: string
  unsubscribedAt: string
}) {
  const date = formatDate(unsubscribedAt)
  return (
    <Shell monoLabel="// UNSUBSCRIBE · ALREADY">
      <h1 className={styles.heading}>You&apos;re already unsubscribed.</h1>
      <p className={styles.body}>
        We haven&apos;t sent you marketing emails since {date}. You won&apos;t get any more.
      </p>
      <Link
        href={`/unsubscribe?token=${encodeURIComponent(token)}&resubscribe=true`}
        className={styles.resubLink}
      >
        Made a mistake? Re-subscribe here →
      </Link>
      <FooterLink />
    </Shell>
  )
}

function ResubscribedState() {
  return (
    <Shell monoLabel="// UNSUBSCRIBE · RESUBSCRIBED">
      <h1 className={styles.heading}>You&apos;re re-subscribed.</h1>
      <p className={styles.body}>
        Welcome back. We&apos;ll send you the occasional product update.
      </p>
      <FooterLink />
    </Shell>
  )
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; resubscribe?: string; done?: string }>
}) {
  const sp = await searchParams
  const token = typeof sp.token === 'string' ? sp.token.trim() : ''
  const isResubscribe = sp.resubscribe === 'true'
  const isDone = sp.done === 'true'

  if (!token) {
    return <InvalidState />
  }

  const lookup = await lookupLead(token)
  if (!lookup.ok) {
    return <InvalidState />
  }

  const { lead } = lookup

  if (isResubscribe) {
    // Click on the re-subscribe link is the explicit consent. Server-side
    // update on first render, then show success. Idempotent: if already
    // subscribed, skip the write and render success regardless.
    const alreadySubscribed = lead.unsubscribed_at === null && lead.marketing_consent === true
    if (!alreadySubscribed) {
      const ok = await resubscribeLead(lead.id)
      if (!ok) {
        return <InvalidState />
      }
    }
    return <ResubscribedState />
  }

  if (isDone) {
    // Post-confirm landing. Render success if the DB confirms it.
    if (lead.unsubscribed_at !== null) {
      return <SuccessState token={token} />
    }
  }

  if (lead.unsubscribed_at !== null) {
    return <AlreadyUnsubscribedState token={token} unsubscribedAt={lead.unsubscribed_at} />
  }

  return <ConfirmState token={token} email={lead.email} />
}
