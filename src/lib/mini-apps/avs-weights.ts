/**
 * AI Visibility Score (AVS) methodology — fixed weights for the ownable metric.
 * Presence 35% · Citations 30% · Entity Clarity 20% · Drift 15%
 */
export const AVS_WEIGHTS = {
  presence: 35,
  citations: 30,
  entity_clarity: 20,
  drift: 15,
} as const

export type AVSSubScoreKey = keyof typeof AVS_WEIGHTS

export const AVS_SUB_SCORE_ORDER: AVSSubScoreKey[] = [
  'presence',
  'citations',
  'entity_clarity',
  'drift',
]

export const AVS_SUB_SCORE_LABELS: Record<AVSSubScoreKey, string> = {
  presence: 'Presence',
  citations: 'Citations',
  entity_clarity: 'Entity Clarity',
  drift: 'Drift',
}

export function scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 85) return 'A'
  if (score >= 70) return 'B'
  if (score >= 55) return 'C'
  if (score >= 40) return 'D'
  return 'F'
}

export function computeAvs(subScores: Record<AVSSubScoreKey, number>): number {
  let total = 0
  for (const key of AVS_SUB_SCORE_ORDER) {
    total += (subScores[key] / 100) * AVS_WEIGHTS[key]
  }
  return Math.round(Math.min(100, Math.max(0, total)))
}
