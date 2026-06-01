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

export type ScanSuccess = { ok: true; scanId: string; free: ScanFree }
export type ScanError = { ok: false; message: string }
export type ScanApiResponse = ScanSuccess | ScanError

export type UnlockSuccess = { ok: true; data: ScanGated }
export type UnlockError = { ok: false; message: string }
export type UnlockApiResponse = UnlockSuccess | UnlockError
