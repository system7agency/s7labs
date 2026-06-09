import { FirecrawlAppV1 as FirecrawlApp } from '@mendable/firecrawl-js'

import type { CollectorSignal } from './index'

const TECH_PATTERNS: Array<{ label: string; regex: RegExp }> = [
  { label: 'Next.js', regex: /\bnext\.?js\b/i },
  { label: 'React', regex: /\breact\b/i },
  { label: 'HubSpot', regex: /\bhubspot\b/i },
  { label: 'Salesforce', regex: /\bsalesforce\b/i },
  { label: 'Segment', regex: /\bsegment\b/i },
  { label: 'Intercom', regex: /\bintercom\b/i },
]

type ProviderSignalsFn = (domain: string) => Promise<CollectorSignal[] | unknown>

function asCollectorSignals(value: unknown): CollectorSignal[] {
  if (!Array.isArray(value)) return []
  const normalized: CollectorSignal[] = []
  for (const item of value) {
    if (!item || typeof item !== 'object') continue
    const row = item as Partial<CollectorSignal>
    if (!row.headline || !row.detail || !row.source || !row.sourceUrl || !row.observedAt) continue
    normalized.push({
      type: 'tech',
      headline: row.headline,
      detail: row.detail,
      source: row.source,
      sourceUrl: row.sourceUrl,
      observedAt: row.observedAt,
    })
  }
  return normalized
}

async function collectWithTechProvider(domain: string): Promise<CollectorSignal[]> {
  const providerModulePath = process.env.TECH_STACK_PROVIDER_MODULE
  if (!providerModulePath) return []

  try {
    const mod = (await import(providerModulePath)) as Record<string, unknown>
    const maybeFn = ['collectTechSignals', 'collectTechStackSignals', 'lookupTechSignals']
      .map((key) => mod[key])
      .find((candidate): candidate is ProviderSignalsFn => typeof candidate === 'function')
    if (!maybeFn) return []
    return asCollectorSignals(await maybeFn(domain))
  } catch {
    return []
  }
}

async function collectWithHomepageMarkers(domain: string): Promise<CollectorSignal[]> {
  const firecrawlKey = process.env.FIRECRAWL_API_KEY
  if (!firecrawlKey) return []

  const firecrawl = new FirecrawlApp({ apiKey: firecrawlKey })
  const root = `https://${domain}`
  const result = await firecrawl.scrapeUrl(root, { formats: ['markdown'] }).catch(() => null)
  if (!result || !result.success || !result.markdown) return []

  const signals: CollectorSignal[] = []
  const now = new Date().toISOString()
  for (const entry of TECH_PATTERNS) {
    if (!entry.regex.test(result.markdown)) continue
    signals.push({
      type: 'tech',
      headline: `${entry.label} footprint detected`,
      detail: `The website content references ${entry.label}, indicating active tooling that can influence GTM and ops priorities.`,
      source: 'Website tech markers',
      sourceUrl: root,
      observedAt: now,
    })
    if (signals.length >= 3) break
  }

  return signals
}

export async function collectTechSignals(domain: string): Promise<CollectorSignal[]> {
  const providerSignals = await collectWithTechProvider(domain)
  if (providerSignals.length > 0) return providerSignals
  return collectWithHomepageMarkers(domain)
}
