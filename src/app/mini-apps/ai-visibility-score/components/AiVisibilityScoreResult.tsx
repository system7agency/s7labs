'use client'

import type { AVSResult } from '@/app/api/mini-apps/ai-visibility-score/route'
import '../page-styles.css'

export type AiVisibilityScoreInput = { domain?: string }
export type AiVisibilityScoreOutput = AVSResult

type Props = {
  input: AiVisibilityScoreInput
  output: AiVisibilityScoreOutput
  /**
   * When true, render only the inner result body (shareable hero + sub-score
   * grid + short-read block) without surrounding panel wrappers or the
   * result-footer. The inline mini-app page provides those itself and keeps
   * its own export buttons. The standalone `/results/[id]` route uses the
   * default (full) render.
   */
  bare?: boolean
}

export function gradeClass(grade: string): string {
  const g = grade.toLowerCase()
  if (g === 'a' || g === 'b') return 'grade-a'
  if (g === 'c') return 'grade-c'
  return 'grade-d'
}

export function buildAiVisibilityScorePlainText(r: AVSResult): string {
  const lines = [
    `AI Visibility Score — ${r.domain}`,
    `Brand: ${r.brand} · ${r.category}`,
    '='.repeat(60),
    '',
    `AVS: ${r.avs}/100 (${r.grade})`,
    `"${r.one_liner}"`,
    '',
    '// SUB-SCORES',
    ...r.sub_scores.map((s) => `  ${s.name}: ${s.score}/100 (${s.grade}) — ${s.coverage}`),
    '',
    '// BIGGEST DRAG',
    `${r.biggest_drag.sub_score}: ${r.biggest_drag.why}`,
    '',
    '// SHORT READ',
    ...r.short_read.map((s) => `  ${s.sub_score}: ${s.diagnosis}`),
  ]
  return lines.join('\n')
}

function AvsHero({ result }: { result: AVSResult }) {
  return (
    <div className="shareable-block">
      <div className="avs-hero">
        <div className="avs-hero-top">
          <div>
            <div className={`avs-number ${gradeClass(result.grade)}`}>{result.avs}</div>
            <div className="avs-of">/100</div>
          </div>
          <span className={`grade-badge ${gradeClass(result.grade)}`}>{result.grade}</span>
        </div>
        <p className="avs-one-liner">&ldquo;{result.one_liner}&rdquo;</p>
        <div className="avs-meta">
          <span className="type-pill">{result.brand}</span>
          <span className="type-pill">{result.category}</span>
        </div>
      </div>
      <div className="subscore-grid">
        {result.sub_scores.map((s) => (
          <div key={s.key} className={`subscore-card ${gradeClass(s.grade)}`}>
            <div className="subscore-name">{s.name}</div>
            <div>
              <span className="subscore-value">{s.score}</span>
              <span className="subscore-grade">{s.grade}</span>
            </div>
            <div className="coverage-note">{s.coverage}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ResultBody({ result }: { result: AVSResult }) {
  return (
    <>
      <AvsHero result={result} />
      <div className="short-read-block">
        <div className="section-header">{"// what's dragging your score down"}</div>
        <p className="biggest-drag">
          <span>{result.biggest_drag.sub_score}</span>: {result.biggest_drag.why}
        </p>
        {result.short_read.map((item) => (
          <div key={item.sub_score} className="short-read-item">
            <h4>{item.sub_score}</h4>
            <p>{item.diagnosis}</p>
          </div>
        ))}
      </div>
    </>
  )
}

export function AiVisibilityScoreResult({ input, output, bare = false }: Props) {
  void input
  if (bare) {
    return <ResultBody result={output} />
  }
  return (
    <div className="ai-visibility-score">
      <div className="panel-wrap">
        <div className="panel">
          <div className="panel-body">
            <section className="avs-state active">
              <ResultBody result={output} />
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
