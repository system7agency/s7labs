import { z } from 'zod'

import { loadBulkEmailJob, type BulkEmailJobResult } from '@/lib/mini-apps/bulk-email-jobs'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const QuerySchema = z.object({
  jobId: z.string().uuid(),
})

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

function buildCsv(results: BulkEmailJobResult[]): string {
  const header = [
    'row',
    'first_name',
    'last_name',
    'company',
    'email',
    'status',
    'confidence',
    'title',
    'linkedin_url',
    'company_domain',
    'company_name',
    'error',
  ]

  const lines = results.map((row) =>
    [
      String(row.row),
      row.firstName,
      row.lastName,
      row.company,
      row.email ?? '',
      row.status,
      row.confidence ?? '',
      row.title ?? '',
      row.linkedinUrl ?? '',
      row.companyDomain ?? '',
      row.companyName ?? '',
      row.error ?? '',
    ]
      .map((cell) => escapeCsv(cell))
      .join(',')
  )

  return [header.join(','), ...lines].join('\n')
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const parsed = QuerySchema.safeParse({
    jobId: url.searchParams.get('jobId') ?? '',
  })
  if (!parsed.success) {
    return Response.json({ ok: false, error: 'Invalid job id.' }, { status: 400 })
  }

  const job = await loadBulkEmailJob(parsed.data.jobId)
  if (!job) {
    return Response.json({ ok: false, error: 'Job not found or expired.' }, { status: 404 })
  }
  if (job.status !== 'completed') {
    return Response.json({ ok: false, error: 'Job is not complete yet.' }, { status: 409 })
  }

  const csv = buildCsv(job.results)
  return new Response(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="bulk-email-finder-${job.id}.csv"`,
      'cache-control': 'no-store',
    },
  })
}
