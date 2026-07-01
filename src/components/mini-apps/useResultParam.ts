'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

/**
 * Shared `?result=<id>` restore mechanism for mini-app pages.
 *
 * When a page is opened with `?result=<id>` (from the result email or a reload)
 * the saved output is fetched from the DB and handed to `onRestore`, which the
 * page uses to populate its own state and render the result in its native design
 * (no separate results page). After a fresh run, the page calls `publish(id)` to
 * put `?result=<id>` in the URL so it becomes shareable / reload-safe without a
 * re-fetch.
 *
 * IMPORTANT: pass a STABLE `onRestore` (wrap in useCallback with []), otherwise
 * the restore effect re-runs every render.
 *
 * Usage requires the page's default export to be wrapped in <Suspense> because
 * useSearchParams suspends during static rendering.
 */

const RESULT_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type ResultParam = {
  /** True while a saved result is being fetched. */
  restoring: boolean
  /** True when the URL carries a (well-formed) ?result=<id>. */
  hasResultParam: boolean
  /** Put ?result=<id> in the URL after a fresh run (no re-fetch). */
  publish: (id: string) => void
}

export function useResultParam(
  onRestore: (output: Record<string, unknown>, id: string) => void
): ResultParam {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [restoring, setRestoring] = useState(false)
  // Written only by publish() (a callback), read only by the effect, so we never
  // restore over a result we just produced ourselves.
  const publishedRef = useRef<string | null>(null)

  const rid = searchParams.get('result')
  const hasResultParam = !!rid && RESULT_ID_RE.test(rid)

  useEffect(() => {
    if (!rid || !RESULT_ID_RE.test(rid) || publishedRef.current === rid) return
    setRestoring(true)
    void (async () => {
      try {
        const res = await fetch(`/api/results/${rid}`)
        const data = (await res.json()) as {
          ok?: boolean
          status?: string
          output?: Record<string, unknown> | null
        }
        if (data.ok && data.status === 'completed' && data.output) {
          onRestore(data.output, rid)
        }
      } catch (err) {
        console.error('[useResultParam] restore failed', err)
      } finally {
        setRestoring(false)
      }
    })()
  }, [rid, onRestore])

  // Stable so pages can call it from inside a memoized submit handler.
  const publish = useCallback(
    (id: string) => {
      publishedRef.current = id
      router.replace(`?result=${id}`, { scroll: false })
    },
    [router]
  )

  return { restoring, hasResultParam, publish }
}
