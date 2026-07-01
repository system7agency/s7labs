import { clsx } from 'clsx'

import type { ScanFree, ScanGated } from '@/lib/mini-apps/sov-types'
import { PROVIDER_LABELS } from './ShareOfVoiceResult'

/**
 * Presentational gated detail (question-by-question mention breakdown + how to
 * close the gap).
 *
 * Extracted from ShareOfVoiceResult's ResultBody so it can be rendered in two
 * places from the same markup: the live result render on the mini-app page, and
 * on restore when the page is opened with `?result=<id>` and re-renders the
 * saved output. No data fetching here.
 */
export function ShareOfVoiceGatedDetail({ free, gated }: { free: ScanFree; gated: ScanGated }) {
  const yourBrandName = free.your_brand

  return (
    <>
      <div className="section-header">
        <span>{'// question breakdown'}</span>
      </div>
      {gated.questions.map((q) => (
        <div key={q.question} className="question-block">
          <div className="question-header">{q.question}</div>
          {q.by_provider.map((row) => {
            const hasYou = row.brands_mentioned.some(
              (b) => b.toLowerCase() === yourBrandName.toLowerCase()
            )
            const hasCompetitor = row.brands_mentioned.some(
              (b) => b.toLowerCase() !== yourBrandName.toLowerCase()
            )
            return (
              <div
                key={`${q.question}-${row.provider}`}
                className={clsx('mention-row', {
                  'has-you': hasYou,
                  'missing-you': !hasYou,
                  'competitor-ahead': hasCompetitor && !hasYou,
                })}
              >
                <div className="mention-provider">{PROVIDER_LABELS[row.provider]}</div>
                <div className="mention-brands">
                  {row.brands_mentioned.length > 0 ? (
                    row.brands_mentioned.map((b) => (
                      <span
                        key={b}
                        className={
                          b.toLowerCase() === yourBrandName.toLowerCase()
                            ? 'brand-tag is-you'
                            : 'brand-tag'
                        }
                      >
                        {b}
                      </span>
                    ))
                  ) : (
                    <span className="brand-tag missing">You not mentioned</span>
                  )}
                </div>
                <p className="mention-excerpt">{row.answer_excerpt}</p>
              </div>
            )
          })}
        </div>
      ))}

      <div className="gap-block">
        <div className="gap-eyebrow">{'// how to close the gap'}</div>
        <ol className="gap-list">
          {gated.recommendations.map((item, i) => (
            <li key={i} className="gap-row">
              <span className="gap-number">{String(i + 1).padStart(2, '0')}</span>
              <span className="gap-text">{item}</span>
            </li>
          ))}
        </ol>
      </div>
    </>
  )
}
