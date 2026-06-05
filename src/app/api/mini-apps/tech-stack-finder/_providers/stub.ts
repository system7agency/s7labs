import type { TechStackDetectionResult } from '@/lib/mini-apps/tech-stack-types'

const STUB_CATALOG = {
  analytics: [
    { name: 'Google Analytics', slug: 'googleanalytics', confidence: 0.95 },
    { name: 'PostHog', slug: 'posthog', confidence: 0.72 },
    { name: 'Hotjar', slug: 'hotjar', confidence: 0.63 },
  ],
  advertising: [
    { name: 'Google Ads', slug: 'googleads', confidence: 0.78 },
    { name: 'Meta Pixel', slug: 'meta', confidence: 0.74 },
    { name: 'LinkedIn Insight Tag', slug: 'linkedin', confidence: 0.57 },
  ],
  cms: [
    { name: 'WordPress', slug: 'wordpress', confidence: 0.83 },
    { name: 'Webflow', slug: 'webflow', confidence: 0.67 },
    { name: 'Contentful', slug: 'contentful', confidence: 0.54 },
  ],
  frameworks: [
    { name: 'Next.js', slug: 'nextdotjs', confidence: 0.91 },
    { name: 'React', slug: 'react', confidence: 0.9 },
    { name: 'Tailwind CSS', slug: 'tailwindcss', confidence: 0.84 },
  ],
  hosting: [
    { name: 'Vercel', slug: 'vercel', confidence: 0.86 },
    { name: 'Cloudflare', slug: 'cloudflare', confidence: 0.77 },
    { name: 'Amazon Web Services', slug: 'amazonwebservices', confidence: 0.69 },
  ],
  crm: [
    { name: 'HubSpot CRM', slug: 'hubspot', confidence: 0.76 },
    { name: 'Salesforce', slug: 'salesforce', confidence: 0.61 },
    { name: 'Pipedrive', slug: 'pipedrive', confidence: 0.48 },
  ],
  email: [
    { name: 'Mailchimp', slug: 'mailchimp', confidence: 0.72 },
    { name: 'Klaviyo', slug: 'klaviyo', confidence: 0.59 },
    { name: 'Customer.io', slug: 'customerio', confidence: 0.52 },
  ],
  ecommerce: [
    { name: 'Shopify', slug: 'shopify', confidence: 0.88 },
    { name: 'Stripe', slug: 'stripe', confidence: 0.74 },
    { name: 'WooCommerce', slug: 'woocommerce', confidence: 0.58 },
  ],
  other: [
    { name: 'Intercom', slug: 'intercom', confidence: 0.65 },
    { name: 'Zendesk', slug: 'zendesk', confidence: 0.47 },
    { name: 'Sentry', slug: 'sentry', confidence: 0.71 },
  ],
} as const

function hash(input: string): number {
  let h = 0
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function pickTech(
  domain: string,
  group: readonly { name: string; slug: string; confidence: number }[]
) {
  const domainHash = hash(domain)
  const count = 1 + (domainHash % 3)
  const picked: { name: string; slug: string; confidence?: number }[] = []

  for (let i = 0; i < count; i++) {
    const idx = (domainHash + i * 7) % group.length
    const item = group[idx]
    if (!item) continue
    const confidenceBump = ((domainHash + i * 13) % 11) / 100
    picked.push({
      name: item.name,
      slug: item.slug,
      confidence: Math.min(0.99, Number((item.confidence - 0.05 + confidenceBump).toFixed(2))),
    })
  }

  const bySlug = new Map(picked.map((tech) => [tech.slug, tech]))
  return [...bySlug.values()]
}

export async function detectTechnologiesWithStub(
  domain: string
): Promise<TechStackDetectionResult> {
  const categories = [
    { name: 'Analytics', technologies: pickTech(domain, STUB_CATALOG.analytics) },
    { name: 'Advertising', technologies: pickTech(domain, STUB_CATALOG.advertising) },
    { name: 'CMS', technologies: pickTech(domain, STUB_CATALOG.cms) },
    { name: 'Frameworks', technologies: pickTech(domain, STUB_CATALOG.frameworks) },
    { name: 'Hosting/CDN', technologies: pickTech(domain, STUB_CATALOG.hosting) },
    { name: 'CRM/Sales', technologies: pickTech(domain, STUB_CATALOG.crm) },
    { name: 'Email/Marketing', technologies: pickTech(domain, STUB_CATALOG.email) },
    { name: 'Ecommerce', technologies: pickTech(domain, STUB_CATALOG.ecommerce) },
    { name: 'Other', technologies: pickTech(domain, STUB_CATALOG.other) },
  ] satisfies TechStackDetectionResult['categories']

  return { categories }
}
