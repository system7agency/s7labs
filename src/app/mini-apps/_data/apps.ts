export type AppStatus = 'live' | 'beta' | 'new' | 'prototype' | 'coming-soon'

export type AppThumb = 'score' | 'radar' | 'hook' | 'brief'

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
    id: 'job-brief',
    name: 'Job Posting to Sales Brief',
    status: 'live',
    category: 'AI / Operations',
    cats: ['ai', 'operations'],
    short_description:
      'Drop a job posting URL or paste the text. Get a sales brief with pain points, tech stack, budget signals, and a ready-to-use pitch.',
    tags: ['sales', 'jobs', 'brief', 'signals', 'ai'],
    thumb: 'brief',
    launch_url: '/mini-apps/job-brief',
    learn_more: {
      what_it_does:
        'Scrapes or reads a job posting, then uses AI to extract the tech stack, infer pain points, identify budget signals, and write a specific sales angle — plus the ideal first contact to reach out to.',
      how_it_works: {
        inputs: ['job posting URL or pasted text'],
        outputs: ['pain points', 'tech stack', 'budget signals', 'sales angle', 'ideal contact'],
      },
      who_its_for:
        'AEs and SDRs who want to turn job postings into warm, intelligence-led outreach instead of guessing what the company needs.',
      build_potential:
        'Could become a real-time job-feed monitor that auto-generates briefs for every new posting matching your ICP.',
    },
    interest_context: 'job-brief',
  },
  {
    id: 'linkedin-hook',
    name: 'LinkedIn Post to Outbound Hook',
    status: 'live',
    category: 'AI / Operations',
    cats: ['ai', 'operations'],
    short_description:
      'Paste a LinkedIn post. Get three personalised outbound hooks — each with a different angle, tone, and channel.',
    tags: ['outbound', 'linkedin', 'hooks', 'copywriting', 'ai'],
    thumb: 'hook',
    launch_url: '/mini-apps/linkedin-hook',
    learn_more: {
      what_it_does:
        'Reads a LinkedIn post, extracts the outbound trigger (opinion, achievement, pain, or news), profiles the ideal buyer persona, and writes three ready-to-send hooks with distinct angles across LinkedIn DM, email, and cold call.',
      how_it_works: {
        inputs: ['linkedin post text'],
        outputs: ['trigger', 'persona', '3 hooks', 'best pick'],
      },
      who_its_for:
        'SDRs and AEs who want to turn content they see in their feed into instant, highly personalised outbound without spending 20 minutes writing.',
      build_potential:
        'Could become a feed-connected prospecting tool that surfaces posts and auto-generates hooks in real time.',
    },
    interest_context: 'linkedin-hook',
  },
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
