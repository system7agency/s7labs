import type { CostBreakdown } from '@/lib/llm/cost'
import type { AVSSubScoreKey } from '@/lib/mini-apps/avs-weights'

export type SubScore = {
  key: AVSSubScoreKey
  name: string
  score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  coverage: string
}

export type AVSResult = {
  domain: string
  brand: string
  category: string
  avs: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  one_liner: string
  /** The AI engines the brand's presence was actually checked across
   * (e.g. ['Claude', 'ChatGPT', 'Perplexity']). Surfaced in the report so it's
   * clear the score spans multiple engines, not just one. */
  engines_checked: string[]
  sub_scores: SubScore[]
  biggest_drag: { sub_score: string; why: string }
  short_read: { sub_score: string; diagnosis: string }[]
  fix_recommendations: string[]
  tokens_in: number
  tokens_out: number
}

export type AVSApiResponse =
  | { ok: true; data: AVSResult; cost?: CostBreakdown }
  | { ok: false; message: string }

export type AvsScanSnapshot = {
  domain: string
  avs: number
  sub_scores: SubScore[]
  payload: AVSResult
  created_at: string
}
