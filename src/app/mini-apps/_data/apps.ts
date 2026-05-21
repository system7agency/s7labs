export type AppStatus = 'live' | 'beta' | 'new' | 'prototype' | 'coming-soon'

export type AppThumb = 'score' | 'radar'

export type MiniApp = {
  id: string
  name: string
  status: AppStatus
  category: string
  /** category keywords used by the chip filter */
  cats: string[]
  short_description: string
  tags: string[]
  thumb: AppThumb
  launch_url: string | null
  learn_more: {
    what_it_does: string
    how_it_works: { inputs: string[]; outputs: string[] }
    who_its_for: string
    build_potential: string
  }
  interest_context: string
}

export const CATEGORIES = [
  { id: 'all', label: 'ALL' },
  { id: 'ai', label: 'AI' },
  { id: 'operations', label: 'OPERATIONS' },
  { id: 'utilities', label: 'UTILITIES' },
] as const

export const APPS: MiniApp[] = [
  {
    id: 'outbound-radar',
    name: 'Outbound Trigger Radar',
    status: 'live',
    category: 'AI / Operations',
    cats: ['ai', 'operations'],
    short_description:
      'Enter a company domain. Get a scored brief of buy signals, the best outreach angle, and who to contact first.',
    tags: ['outbound', 'signals', 'sales', 'intent', 'ai'],
    thumb: 'radar',
    launch_url: '/mini-apps/outbound-radar',
    learn_more: {
      what_it_does:
        'Scrapes a company homepage, about page, and careers page in parallel, then uses AI to detect buying signals — hiring patterns, expansion moves, tech changes — and scores overall intent. Returns a concrete outreach angle and best-fit persona.',
      how_it_works: {
        inputs: ['company name', 'domain'],
        outputs: ['intent score', 'urgency', 'buy signals', 'outreach angle', 'best persona'],
      },
      who_its_for:
        'SDRs, AEs, and founders who want fast, evidence-based context before a cold outreach — instead of guessing.',
      build_potential:
        'Could become a full account-intelligence layer feeding directly into a CRM or sequencer.',
    },
    interest_context: 'outbound-radar',
  },
  {
    id: 'pricing-diagnostic',
    name: 'Pricing Page Diagnostic',
    status: 'live',
    category: 'AI / Utilities',
    cats: ['ai', 'utilities'],
    short_description:
      'Drop any SaaS pricing page URL. Get a brutal teardown and three concrete improvements.',
    tags: ['pricing', 'saas', 'conversion', 'audit', 'ai'],
    thumb: 'score',
    launch_url: '/mini-apps/pricing-diagnostic',
    learn_more: {
      what_it_does:
        'Scrapes any pricing page and runs it through a structured AI rubric — scoring friction, clarity, plan legibility, and buyer targeting. Returns three concrete improvements ranked by conversion impact.',
      how_it_works: {
        inputs: ['pricing page url'],
        outputs: ['friction score', 'clarity grade', 'buyer inference', '3 improvements'],
      },
      who_its_for:
        "Product, marketing, and founders who want a fast, honest read on their own pricing page — or a competitor's.",
      build_potential: 'Could become a full pricing strategy audit tool with historical tracking.',
    },
    interest_context: 'pricing-diagnostic',
  },
]

export function getAppById(id: string): MiniApp | undefined {
  return APPS.find((a) => a.id === id)
}
