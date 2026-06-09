import type { TechStackDetectionResult } from '@/lib/mini-apps/tech-stack-types'
import { detectTechnologiesWithStub } from './stub'

export class ProviderQuotaError extends Error {
  constructor(message = 'Provider quota exceeded') {
    super(message)
    this.name = 'ProviderQuotaError'
  }
}

export type TechDetectProvider = {
  name: string
  detectTechnologies: (domain: string) => Promise<TechStackDetectionResult>
}

let cachedProvider: TechDetectProvider | null = null

function createProvider(): TechDetectProvider {
  const configured = (process.env.TECH_DETECT_PROVIDER ?? 'stub').trim().toLowerCase()

  // Vendor env guide:
  // - TECH_DETECT_PROVIDER=stub|builtwith|wappalyzer
  // - TECH_DETECT_BUILTWITH_API_KEY=<server-only key>
  // - TECH_DETECT_WAPPALYZER_API_KEY=<server-only key>
  // Until a vendor integration is wired, all values fall back to the stub provider.
  if (configured === 'stub' || configured === 'builtwith' || configured === 'wappalyzer') {
    return { name: 'stub', detectTechnologies: detectTechnologiesWithStub }
  }

  return { name: 'stub', detectTechnologies: detectTechnologiesWithStub }
}

export function getTechDetectProvider(): TechDetectProvider {
  if (!cachedProvider) {
    cachedProvider = createProvider()
  }
  return cachedProvider
}

export function isQuotaError(error: unknown): boolean {
  if (error instanceof ProviderQuotaError) return true
  if (!(error instanceof Error)) return false
  const msg = error.message.toLowerCase()
  return msg.includes('quota') || msg.includes('rate limit')
}
