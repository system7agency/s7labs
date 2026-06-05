import { NextResponse } from 'next/server'
import { z } from 'zod'

import { loadBulkEmailJob } from '@/lib/mini-apps/bulk-email-jobs'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const QuerySchema = z.object({
  jobId: z.string().uuid(),
})

type StatusResponse =
  | {
      ok: true
      job: {
        id: string
        status: 'processing' | 'completed' | 'failed'
        total: number
        completed: number
        results: unknown[]
      }
    }
  | { ok: false; error: string }

function jsonResponse(body: StatusResponse, status: number) {
  return NextResponse.json(body, { status })
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const parsed = QuerySchema.safeParse({
    jobId: url.searchParams.get('jobId') ?? '',
  })
  if (!parsed.success) {
    return jsonResponse({ ok: false, error: 'Invalid job id.' }, 400)
  }

  const job = await loadBulkEmailJob(parsed.data.jobId)
  if (!job) {
    return jsonResponse({ ok: false, error: 'Job not found or expired.' }, 404)
  }

  return jsonResponse(
    {
      ok: true,
      job: {
        id: job.id,
        status: job.status,
        total: job.total,
        completed: job.completed,
        results: job.results,
      },
    },
    200
  )
}
