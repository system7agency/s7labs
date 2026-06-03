import { normalizeDomain } from '@/lib/mini-apps/normalize-domain'

const DATAFORSEO_ENDPOINT = 'https://api.dataforseo.com/v3/serp/google/organic/live/advanced'
const LANGUAGE_CODE = 'en'
const DEFAULT_LOCATION_CODE = 2840
const DEVICE = 'mobile'
const OS = 'android'

type DataforseoAiRef = { domain?: string; url?: string; title?: string; source?: string }
type DataforseoItem = {
  type?: string
  domain?: string
  url?: string
  title?: string
  items?: DataforseoItem[]
  references?: DataforseoAiRef[]
}

export type AioCitationResult = {
  keyword: string
  ai_overview_present: boolean
  brand_cited: boolean
  ok: boolean
}

function collectAioSources(item: DataforseoItem | undefined): { domain: string }[] {
  if (!item) return []
  const out: { domain: string }[] = []
  const pushRef = (ref: DataforseoAiRef) => {
    const domain = (ref.domain ?? '').toLowerCase().replace(/^www\./, '')
    if (!domain) return
    if (out.some((s) => s.domain === domain)) return
    out.push({ domain })
  }
  for (const ref of item.references ?? []) pushRef(ref)
  for (const child of item.items ?? []) {
    for (const ref of child.references ?? []) pushRef(ref)
    if (child.type === 'ai_overview_reference') {
      pushRef({ domain: child.domain, url: child.url, title: child.title })
    }
  }
  return out
}

export async function scanAioBrandCited(
  login: string,
  password: string,
  keyword: string,
  trackedDomain: string,
  signal: AbortSignal,
  locationCode = DEFAULT_LOCATION_CODE
): Promise<AioCitationResult> {
  const auth = Buffer.from(`${login}:${password}`).toString('base64')
  try {
    const res = await fetch(DATAFORSEO_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      cache: 'no-store',
      signal,
      body: JSON.stringify([
        {
          keyword,
          language_code: LANGUAGE_CODE,
          location_code: locationCode,
          device: DEVICE,
          os: OS,
          load_async_ai_overview: true,
        },
      ]),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const payload = (await res.json()) as {
      tasks?: Array<{ result?: Array<{ items?: DataforseoItem[] }> }>
    }
    const items = payload.tasks?.[0]?.result?.[0]?.items ?? []
    const aio = items.find((i) => i.type === 'ai_overview')
    const ai_overview_present = Boolean(aio)
    const sources = collectAioSources(aio)
    const brand_cited = sources.some((s) => normalizeDomain(s.domain) === trackedDomain)
    return { keyword, ai_overview_present, brand_cited, ok: true }
  } catch {
    return { keyword, ai_overview_present: false, brand_cited: false, ok: false }
  }
}
