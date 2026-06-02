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

export type ScanSuccess = { ok: true; scanId: string; free: ScanFree }
export type ScanError = { ok: false; message: string }
export type ScanApiResponse = ScanSuccess | ScanError

export type UnlockSuccess = { ok: true; data: ScanGated }
export type UnlockError = { ok: false; message: string }
export type UnlockApiResponse = UnlockSuccess | UnlockError

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
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
