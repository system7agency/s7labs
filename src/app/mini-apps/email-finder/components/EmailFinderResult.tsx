'use client'

import type { ReactNode } from 'react'

import { clsx } from 'clsx'

import type { EmailFinderResult as EmailFinderResultData } from '@/app/api/mini-apps/email-finder/route'
import '../page-styles.css'

export type EmailFinderInput = { name?: string; company?: string }
export type EmailFinderOutput = EmailFinderResultData

type Props = {
  input: EmailFinderInput
  output: EmailFinderOutput
  /**
   * When true, render only the inner result body (head + email hero + meta
   * grid + verified line + footer slot) without the surrounding
   * `.email-finder / .panel-wrap / .panel / .panel-body / .ef-state`
   * wrappers. The inline mini-app page provides those itself and keeps its
   * own copy button + "Run another" button at page level, so it consumes
   * the component in bare mode. The standalone `/results/[id]` route uses
   * the default (full) render.
   */
  bare?: boolean
  /**
   * Override the `VERIFIED` label on the result head. The inline mini-app
   * page passes a formatted timestamp like
   * `VERIFIED · 2026-06-10 · 14:32 UTC`.
   */
  tsLabel?: string
  /**
   * Optional render slot for the interactive copy button (inline page
   * passes its own stateful copy-to-clipboard button). Standalone falls
   * back to a static `<code>` rendering.
   */
  renderCopyButton?: () => ReactNode
  /**
   * Optional render slot for the result footer (inline page renders a
   * "Run another" button).
   */
  renderFooter?: () => ReactNode
}

function ResultBody({
  output,
  tsLabel = 'VERIFIED',
  renderCopyButton,
  renderFooter,
}: {
  output: EmailFinderOutput
  tsLabel?: string
  renderCopyButton?: () => ReactNode
  renderFooter?: () => ReactNode
}) {
  return (
    <>
      <div className="result-head">
        <span className="title">Email found</span>
        <span className="ts-label">{tsLabel}</span>
      </div>

      <div className="ef-email-hero">
        <div className="ef-email-row">
          <span className="ef-email">{output.email ?? '—'}</span>
          {output.confidence ? (
            <span
              className={clsx('ef-confidence', {
                high: output.confidence === 'HIGH',
                medium: output.confidence === 'MEDIUM',
                low: output.confidence === 'LOW',
              })}
            >
              {output.confidence}
            </span>
          ) : null}
          {renderCopyButton ? renderCopyButton() : null}
        </div>
      </div>

      <div className="ef-meta-grid">
        <div className="ef-meta-item">
          <span className="ef-meta-label">Full name</span>
          <span className="ef-meta-value">{output.fullName}</span>
        </div>
        <div className="ef-meta-item">
          <span className="ef-meta-label">Title</span>
          <span className="ef-meta-value">{output.title ?? '—'}</span>
        </div>
        <div className="ef-meta-item">
          <span className="ef-meta-label">Company</span>
          <span className="ef-meta-value">{output.companyName || output.companyDomain || '—'}</span>
        </div>
        <div className="ef-meta-item">
          <span className="ef-meta-label">LinkedIn</span>
          <span className="ef-meta-value">
            {output.linkedinUrl ? (
              <a href={output.linkedinUrl} target="_blank" rel="noopener noreferrer">
                View profile →
              </a>
            ) : (
              '—'
            )}
          </span>
        </div>
      </div>

      <div className="ef-verified-line">Verified via Apollo</div>

      {renderFooter ? renderFooter() : null}
    </>
  )
}

export function EmailFinderResult({
  input,
  output,
  bare = false,
  tsLabel,
  renderCopyButton,
  renderFooter,
}: Props) {
  void input
  if (bare) {
    return (
      <ResultBody
        output={output}
        tsLabel={tsLabel}
        renderCopyButton={renderCopyButton}
        renderFooter={renderFooter}
      />
    )
  }
  return (
    <div className="email-finder">
      <div className="panel-wrap">
        <div className="panel">
          <div className="panel-body">
            <section className="ef-state active">
              <ResultBody
                output={output}
                tsLabel={tsLabel}
                renderCopyButton={renderCopyButton}
                renderFooter={renderFooter}
              />
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
