export const NORMALIZED_TECH_CATEGORIES = [
  'Analytics',
  'Advertising',
  'CMS',
  'Frameworks',
  'Hosting/CDN',
  'CRM/Sales',
  'Email/Marketing',
  'Ecommerce',
  'Other',
] as const

export type NormalizedTechCategory = (typeof NORMALIZED_TECH_CATEGORIES)[number]

export type TechnologyMatch = {
  name: string
  slug: string
  confidence?: number
}

export type TechnologyCategory = {
  name: NormalizedTechCategory
  technologies: TechnologyMatch[]
}

export type TechStackDetectionResult = {
  categories: TechnologyCategory[]
}

export type TechStackFinderResult = {
  domain: string
  categories: TechnologyCategory[]
  totalTechnologies: number
  analyzedAt: string
  provider: string
  cached: boolean
}

export type TechStackFinderApiResponse =
  | { ok: true; data: TechStackFinderResult }
  | { ok: false; message: string }
