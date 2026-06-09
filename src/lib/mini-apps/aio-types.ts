import type { CostBreakdown } from '@/lib/llm/cost'

export type KeywordStatus = 'cited' | 'blind_spot' | 'ghost' | 'no_aio' | 'error'

export type KeywordAIO = {
  keyword: string
  ai_overview_present: boolean
  brand_cited: boolean
  organic_present: boolean
  status: KeywordStatus
  sources: { domain: string; url: string; title: string }[]
}

export type ScanFree = {
  domain: string
  location: string
  keywords_scored: number
  one_liner: string
  verdict_label: string
  aio_trigger_rate: number
  citation_rate: number
  blind_spot_count: number
  ghost_count: number
  keyword_statuses: {
    keyword: string
    ai_overview_present: boolean
    brand_cited: boolean
    status: KeywordStatus
  }[]
  top_cited_competitor: { domain: string; appearances: number } | null
}

export type ScanGated = {
  keywords: KeywordAIO[]
  citation_leaders: { domain: string; appearances: number }[]
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

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function isKeywordStatus(v: unknown): v is KeywordStatus {
  return v === 'cited' || v === 'blind_spot' || v === 'ghost' || v === 'no_aio' || v === 'error'
}

function isScanFree(v: unknown): v is ScanFree {
  if (!isRecord(v)) return false
  if (!Array.isArray(v.keyword_statuses)) return false
  for (const row of v.keyword_statuses) {
    if (!isRecord(row)) return false
    if (typeof row.keyword !== 'string') return false
    if (typeof row.ai_overview_present !== 'boolean') return false
    if (typeof row.brand_cited !== 'boolean') return false
    if (!isKeywordStatus(row.status)) return false
  }
  const comp = v.top_cited_competitor
  const compOk =
    comp === null ||
    (isRecord(comp) && typeof comp.domain === 'string' && typeof comp.appearances === 'number')
  return (
    typeof v.domain === 'string' &&
    typeof v.location === 'string' &&
    typeof v.keywords_scored === 'number' &&
    typeof v.one_liner === 'string' &&
    typeof v.verdict_label === 'string' &&
    typeof v.aio_trigger_rate === 'number' &&
    typeof v.citation_rate === 'number' &&
    typeof v.blind_spot_count === 'number' &&
    typeof v.ghost_count === 'number' &&
    compOk
  )
}

function isScanGated(v: unknown): v is ScanGated {
  if (!isRecord(v)) return false
  return (
    Array.isArray(v.keywords) &&
    Array.isArray(v.citation_leaders) &&
    Array.isArray(v.recommendations) &&
    typeof v.tokens_in === 'number' &&
    typeof v.tokens_out === 'number'
  )
}

export function parseUnlockApiResponse(raw: unknown): UnlockApiResponse {
  if (!isRecord(raw)) return { ok: false, message: 'Invalid response. Please try again.' }
  if (raw.ok === false && typeof raw.message === 'string')
    return { ok: false, message: raw.message }
  if (raw.ok !== true || !isScanGated(raw.data)) {
    return { ok: false, message: 'Invalid response. Please try again.' }
  }
  return { ok: true, data: raw.data }
}

export function parseScanApiResponse(raw: unknown): ScanApiResponse {
  if (!isRecord(raw)) return { ok: false, message: 'Invalid response. Please try again.' }
  if (raw.ok === false && typeof raw.message === 'string')
    return { ok: false, message: raw.message }
  if (raw.ok !== true) return { ok: false, message: 'Invalid response. Please try again.' }
  if (typeof raw.scanId !== 'string' || !isScanFree(raw.free)) {
    return { ok: false, message: 'Invalid response. Please try again.' }
  }
  const cost = pickCostBreakdown(raw)
  return cost
    ? { ok: true, scanId: raw.scanId, free: raw.free, cost }
    : { ok: true, scanId: raw.scanId, free: raw.free }
}

function isCostBreakdown(v: unknown): v is CostBreakdown {
  if (!isRecord(v)) return false
  return (
    typeof v.model === 'string' &&
    typeof v.inputTokens === 'number' &&
    typeof v.outputTokens === 'number' &&
    typeof v.costUsd === 'number'
  )
}

export function pickCostBreakdown(raw: unknown): CostBreakdown | undefined {
  if (!isRecord(raw)) return undefined
  const cost = (raw as { cost?: unknown }).cost
  return isCostBreakdown(cost) ? cost : undefined
}
