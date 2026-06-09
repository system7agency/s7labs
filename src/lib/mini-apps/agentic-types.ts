import type { CostBreakdown } from '@/lib/llm/cost'

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F'
export type CheckStatus = 'pass' | 'warn' | 'fail'
export type Priority = 'high' | 'medium' | 'low'
export type Effort = 'low' | 'medium' | 'high'

export const CHECK_NAMES = [
  'Structured Data',
  'Content Clarity',
  'Crawl & Access',
  'Render Dependency',
  'Action Readiness',
  'Identity & Trust',
] as const

export type ReadinessCheck = {
  name: string
  score: number
  grade: Grade
  status: CheckStatus
  finding: string
  fix: string
  priority: Priority
}

export type ScanFree = {
  url: string
  site_name: string
  overall_score: number
  overall_grade: Grade
  one_liner: string
  readiness_label: string
  free_blockers: { name: string; finding: string }[]
  checks_summary: { name: string; status: CheckStatus }[]
  total_issues: number
}

export type ScanGated = {
  checks: ReadinessCheck[]
  prioritised_plan: { rank: number; action: string; impact: string; effort: Effort }[]
  quick_wins: string[]
  tokens_in: number
  tokens_out: number
}

export type ScanSuccess = { ok: true; scanId: string; free: ScanFree; cost?: CostBreakdown }
export type ScanError = { ok: false; message: string }
export type ScanApiResponse = ScanSuccess | ScanError

/** Unlock route returns `{ ok: true, data: ScanGated }` — gated fields are never top-level. */
export type UnlockSuccess = { ok: true; data: ScanGated }
export type UnlockError = { ok: false; message: string }
export type UnlockApiResponse = UnlockSuccess | UnlockError

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function isScanGated(v: unknown): v is ScanGated {
  if (!isRecord(v)) return false
  return (
    Array.isArray(v.checks) &&
    Array.isArray(v.prioritised_plan) &&
    Array.isArray(v.quick_wins) &&
    typeof v.tokens_in === 'number' &&
    typeof v.tokens_out === 'number'
  )
}

/** Validates unlock JSON so a flattened or malformed body cannot crash the client. */
export function parseUnlockApiResponse(raw: unknown): UnlockApiResponse {
  if (!isRecord(raw)) {
    return { ok: false, message: 'Invalid response. Please try again.' }
  }
  if (raw.ok === false && typeof raw.message === 'string') {
    return { ok: false, message: raw.message }
  }
  if (raw.ok !== true) {
    return { ok: false, message: 'Invalid response. Please try again.' }
  }
  const gated = raw.data
  if (!isScanGated(gated)) {
    return { ok: false, message: 'Invalid response. Please try again.' }
  }
  return { ok: true, data: gated }
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
