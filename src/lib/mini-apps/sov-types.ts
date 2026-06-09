import type { CostBreakdown } from '@/lib/llm/cost'

export type Provider = 'claude' | 'chatgpt' | 'perplexity'

export type BrandScore = {
  name: string
  domain: string
  is_you: boolean
  appearances: number
  total_answers: number
  share_of_voice: number
  rank: number
  by_provider: { provider: Provider; appearances: number; total: number; share: number }[]
}

export type ScanFree = {
  category: string
  your_brand: string
  your_domain: string
  providers_used: Provider[]
  questions_count: number
  headline: {
    your_share: number
    your_rank: number
    total_brands: number
    top_competitor: string
    top_competitor_share: number
  }
  scores: BrandScore[]
}

export type ScanGated = {
  questions: {
    question: string
    by_provider: {
      provider: Provider
      answer_excerpt: string
      brands_mentioned: string[]
    }[]
  }[]
  recommendations: string[]
  tokens_in: number
  tokens_out: number
}

export type ScanSuccess = { ok: true; scanId: string; free: ScanFree; cost?: CostBreakdown }
export type ScanError = { ok: false; message: string }
export type ScanApiResponse = ScanSuccess | ScanError

export type UnlockSuccess = { ok: true; data: ScanGated }
export type UnlockError = { ok: false; message: string }
export type UnlockApiResponse = UnlockSuccess | UnlockError
