const WINDOW_MS = 60 * 60 * 1000
const MAX_PER_WINDOW = 10

type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

export function checkRateLimit(ip: string): { ok: boolean; resetAt: number } {
  const now = Date.now()
  const bucket = buckets.get(ip)
  if (!bucket || bucket.resetAt <= now) {
    const next = { count: 1, resetAt: now + WINDOW_MS }
    buckets.set(ip, next)
    return { ok: true, resetAt: next.resetAt }
  }
  if (bucket.count >= MAX_PER_WINDOW) {
    return { ok: false, resetAt: bucket.resetAt }
  }
  bucket.count += 1
  return { ok: true, resetAt: bucket.resetAt }
}

export function getClientIp(headers: Headers): string {
  const fwd = headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]!.trim()
  const real = headers.get('x-real-ip')
  if (real) return real.trim()
  return 'unknown'
}
