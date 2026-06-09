/* eslint-disable no-console */
/**
 * Lightweight unit-ish checks for the results page state logic. Run with:
 *   npx tsx src/app/results/\[submissionId\]/_components/results.test.ts
 *
 * Not wired to vitest yet; this exists to verify FailedState and ExpiredState
 * branches without modifying production rows.
 */

import { ageInDays, formatRelativeTime, RESULT_EXPIRY_DAYS } from './format-time'

let failures = 0
function assert(cond: boolean, msg: string) {
  if (!cond) {
    failures += 1
    console.error('FAIL:', msg)
  } else {
    console.log('ok:', msg)
  }
}

// formatRelativeTime
const now = new Date('2026-06-09T12:00:00Z')
assert(
  formatRelativeTime(new Date('2026-06-09T11:59:30Z'), now) === 'Just now',
  'just now under 1 min'
)
assert(
  formatRelativeTime(new Date('2026-06-09T11:55:00Z'), now) === '5 minutes ago',
  '5 minutes ago'
)
assert(formatRelativeTime(new Date('2026-06-09T09:00:00Z'), now) === '3 hours ago', '3 hours ago')
assert(formatRelativeTime(new Date('2026-06-07T12:00:00Z'), now) === '2 days ago', '2 days ago')

// ageInDays
assert(Math.abs(ageInDays('2026-06-08T12:00:00Z', now) - 1) < 0.0001, '1 day age')
assert(Math.abs(ageInDays('2026-05-09T12:00:00Z', now) - 31) < 0.0001, '31 day age')

// Expiry boundary
assert(ageInDays('2026-05-09T12:00:00Z', now) >= RESULT_EXPIRY_DAYS, 'expired at 31 days')
assert(ageInDays('2026-05-25T12:00:00Z', now) < RESULT_EXPIRY_DAYS, 'not expired at 15 days')

// UUID regex check (mirrors the one in page.tsx).
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
assert(UUID_RE.test('5c770fdb-0e81-4be7-939f-842956c2ac5b'), 'valid uuid passes')
assert(!UUID_RE.test('not-a-uuid'), 'garbage uuid rejected')
assert(!UUID_RE.test('00000000-0000-0000-0000-00000000000g'), 'non-hex char rejected')
assert(UUID_RE.test('00000000-0000-0000-0000-000000000000'), 'zero uuid is well-formed')

if (failures > 0) {
  console.error(`\n${failures} failure(s)`)
  process.exit(1)
}
console.log('\nAll checks passed.')
