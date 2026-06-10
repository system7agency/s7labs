'use client'

/*
 * ExportControls — the canonical Copy / PNG / PDF footer for every mini-app
 * result panel. Replaces the ~70-100 lines of duplicated handleCopy /
 * handleDownloadPng / handleDownloadPdf + inline button JSX that each of the
 * 14 export-capable apps used to carry.
 *
 * Drives the branded export util in `@/lib/mini-apps/export`. Owns its own
 * busy-state machine and surfaces failures via a small inline status line
 * (aria-live) instead of the old silent `catch {}`.
 *
 * Usage:
 *   <ExportControls
 *     resultRef={resultPanelRef}
 *     slug="pricing-diagnostic"
 *     appName="Pricing Page Diagnostic"
 *     filename={`pricing-diagnostic-${slugifiedSubject}`}
 *     subject={trimUrl(result.url)}
 *     plainText={buildPricingDiagnosticPlainText(result)}
 *   />
 */

import { useCallback, useRef, useState } from 'react'
import type { RefObject } from 'react'
import clsx from 'clsx'

import { capturePdf, capturePng, copyText } from '@/lib/mini-apps/export'

type Busy = 'idle' | 'copy' | 'png' | 'pdf'

type Props = {
  /** Ref to the DOM node that should be captured for PNG/PDF. */
  resultRef: RefObject<HTMLElement | null>
  /** Mini-app slug — used in the branded footer URL and the file name. */
  slug: string
  /** Display name shown in the branded export header. */
  appName: string
  /** Base file name without extension (caller pre-slugifies any subject). */
  filename: string
  /** Optional subtitle for the branded header (e.g. analyzed URL/company). */
  subject?: string
  /** Pre-built plain text for the Copy button. */
  plainText: string
  /** Hide individual controls if an app doesn't support them. */
  enable?: { copy?: boolean; png?: boolean; pdf?: boolean }
}

export function ExportControls({
  resultRef,
  slug,
  appName,
  filename,
  subject,
  plainText,
  enable,
}: Props) {
  const [busy, setBusy] = useState<Busy>('idle')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = {
    copy: enable?.copy ?? true,
    png: enable?.png ?? true,
    pdf: enable?.pdf ?? true,
  }

  const handleCopy = useCallback(async () => {
    if (busy !== 'idle') return
    setBusy('copy')
    setError(null)
    const ok = await copyText(plainText)
    setBusy('idle')
    if (ok) {
      setCopied(true)
      if (copiedTimer.current) clearTimeout(copiedTimer.current)
      copiedTimer.current = setTimeout(() => setCopied(false), 1800)
    } else {
      setError('Copy failed. Select the text manually.')
    }
  }, [busy, plainText])

  const runCapture = useCallback(
    async (kind: 'png' | 'pdf') => {
      if (busy !== 'idle') return
      const el = resultRef.current
      if (!el) return
      setBusy(kind)
      setError(null)
      try {
        const opts = { slug, appName, filename, subject }
        if (kind === 'png') await capturePng(el, opts)
        else await capturePdf(el, opts)
      } catch (e) {
        console.error(`[${slug}] ${kind} export failed`, e)
        setError(`${kind.toUpperCase()} export failed. Please try again.`)
      } finally {
        setBusy('idle')
      }
    },
    [busy, resultRef, slug, appName, filename, subject]
  )

  return (
    <div className="result-footer">
      {show.copy && (
        <button
          type="button"
          className={clsx('export-btn', { done: copied, loading: busy === 'copy' })}
          onClick={handleCopy}
          disabled={busy !== 'idle'}
          aria-label="Copy result as text"
        >
          {copied ? 'Copied' : busy === 'copy' ? 'Copying…' : 'Copy'}
        </button>
      )}
      {show.png && (
        <button
          type="button"
          className={clsx('export-btn', { loading: busy === 'png' })}
          onClick={() => runCapture('png')}
          disabled={busy !== 'idle'}
          aria-label="Download result as PNG image"
        >
          {busy === 'png' ? 'Saving…' : 'PNG'}
        </button>
      )}
      {show.pdf && (
        <button
          type="button"
          className={clsx('export-btn', { loading: busy === 'pdf' })}
          onClick={() => runCapture('pdf')}
          disabled={busy !== 'idle'}
          aria-label="Download result as PDF"
        >
          {busy === 'pdf' ? 'Saving…' : 'PDF'}
        </button>
      )}
      {error && (
        <span className="field-error" role="alert" style={{ marginLeft: 'auto' }}>
          {error}
        </span>
      )}
    </div>
  )
}
