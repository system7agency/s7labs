export function formatCurrency(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—'
  if (value === 0) return '—'
  if (value < 1) return `$${value.toFixed(4)}`
  if (value < 100) return `$${value.toFixed(2)}`
  return `$${Math.round(value).toLocaleString('en-US')}`
}

export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value == null || Number.isNaN(value)) return '—'
  return `${value.toFixed(decimals)}%`
}

export function formatInteger(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—'
  if (value === 0) return '—'
  return value.toLocaleString('en-US')
}

export type Delta = {
  kind: 'percent' | 'points'
  /** Signed value. positive = up, negative = down */
  value: number
}

export function formatDelta(delta: Delta | null | undefined): {
  text: string
  direction: 'up' | 'down' | 'flat'
} {
  if (!delta || delta.value === 0 || Number.isNaN(delta.value)) {
    return { text: 'No change vs previous period', direction: 'flat' }
  }
  const abs = Math.abs(delta.value)
  const sign = delta.value > 0 ? '+' : '−'
  const unit = delta.kind === 'percent' ? '%' : 'pts'
  return {
    text: `${sign}${abs.toFixed(1)}${unit} vs previous period`,
    direction: delta.value > 0 ? 'up' : 'down',
  }
}

export function redactEmail(email: string | null | undefined): string {
  if (!email) return '—'
  const at = email.indexOf('@')
  if (at < 1) return email
  const head = email.slice(0, 1)
  const domain = email.slice(at + 1)
  return `${head}••@${domain}`
}

export function formatRelativeTime(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  const diffMs = Date.now() - d.getTime()
  const sec = Math.round(diffMs / 1000)
  if (sec < 60) return 'just now'
  const min = Math.round(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.round(hr / 24)
  if (day < 30) return `${day}d ago`
  const month = Math.round(day / 30)
  if (month < 12) return `${month}mo ago`
  const yr = Math.round(month / 12)
  return `${yr}y ago`
}
