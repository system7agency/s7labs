export type AppStatus = 'live' | 'beta' | 'new' | 'prototype' | 'coming-soon'

export type AppThumb =
  | 'score'
  | 'radar'
  | 'hook'
  | 'brief'
  | 'proposal'
  | 'sanity'
  | 'roast'
  | 'blueprint'
  | 'stack'
  | 'sov'

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
  { id: 'automations', label: 'AUTOMATIONS' },
  { id: 'gtm', label: 'GTM' },
  { id: 'software', label: 'SOFTWARE' },
  { id: 'operations', label: 'OPERATIONS' },
  { id: 'utilities', label: 'UTILITIES' },
] as const

export const APPS: MiniApp[] = [
  {
    id: 'share-of-voice',
    name: 'AI Share of Voice Scorer',
    status: 'live',
    category: 'Software / AI',
    cats: ['ai', 'gtm'],
    short_description:
      'Enter your domain and up to 3 competitors. We run the same buying-intent questions across Claude, ChatGPT, and Perplexity and show how often each brand appears in the answers — one headline number free, the full breakdown by email.',
    tags: ['ai search', 'share of voice', 'seo', 'gtm', 'competitors', 'ai'],
    thumb: 'sov',
    launch_url: '/mini-apps/share-of-voice',
    learn_more: {
      what_it_does:
        "Measures how visible a brand is inside AI answers. It generates real buying-intent questions for the brand's category, asks them across Claude, ChatGPT, and Perplexity, and counts how often each brand shows up — giving a share-of-voice score for the brand and its competitors, with the exact questions and answers unlocked by email.",
      how_it_works: {
        inputs: ['your domain', 'up to 3 competitor domains'],
        outputs: [
          'headline share-of-voice number',
          'ranked scoreboard vs competitors',
          'share by AI provider',
          'the exact questions and answers (email-gated)',
          '3 ways to close the gap',
        ],
      },
      who_its_for:
        'Brands, marketers, and agencies who want to know whether AI assistants recommend them or a competitor when buyers ask — the new SEO.',
      build_potential:
        'Could track share of voice over time, alert on competitor moves, expand the question set per category, and run scheduled weekly scans.',
    },
    interest_context: 'share-of-voice',
  },
  {
    id: 'tech-stack-recommender',
    name: 'Tech Stack Recommender',
    status: 'live',
    category: 'Software / AI',
    cats: ['ai', 'software'],
    short_description:
      'Describe a project in plain English and get a recommended tech stack — frontend, backend, database, hosting, auth, payments, and key services — with reasoning, cost estimates, and a complexity rating, all on a clean shareable card.',
    tags: ['tech stack', 'architecture', 'software', 'planning', 'ai'],
    thumb: 'stack',
    launch_url: '/mini-apps/tech-stack-recommender',
    learn_more: {
      what_it_does:
        'Takes a plain-English description of a product idea and returns a recommended tech stack across frontend, backend, database, hosting, auth, and payments, plus the key third-party services it needs — each with reasoning, small-scale cost estimates, a complexity rating, and a build-time estimate, laid out as a clean architecture card.',
      how_it_works: {
        inputs: ['a plain-English description of a project'],
        outputs: [
          'recommended stack per layer',
          'reasoning per choice',
          'cost estimates',
          'complexity rating',
          'build estimate',
          'shareable architecture card',
        ],
      },
      who_its_for:
        'Founders, product people, and agencies scoping a build — and anyone who wants to turn a meeting-room idea into a real architecture on the spot.',
      build_potential:
        'Could compare two stacks side by side, link choices to setup docs, generate a starter repo scaffold, and version stacks as a project evolves.',
    },
    interest_context: 'tech-stack-recommender',
  },
  {
    id: 'automation-blueprint',
    name: 'Automation Blueprint',
    status: 'live',
    category: 'Automations / AI',
    cats: ['ai', 'automations'],
    short_description:
      'Describe a manual process in plain English and get a visual automation blueprint — the steps, the right tool (Make, n8n, Zapier), time saved per week, a difficulty rating, and a starter config.',
    tags: ['automation', 'make', 'n8n', 'zapier', 'workflow', 'ai'],
    thumb: 'blueprint',
    launch_url: '/mini-apps/automation-blueprint',
    learn_more: {
      what_it_does:
        'Turns a plain-English description of a repetitive manual process into a concrete automation blueprint: a rendered flowchart of the steps, which tool to use and why, realistic time saved per week and per year, a difficulty rating, and a starter Make or n8n config to build from.',
      how_it_works: {
        inputs: ['a plain-English description of a manual process'],
        outputs: [
          'visual flowchart',
          'step-by-step breakdown',
          'tool recommendation (Make / n8n / Zapier)',
          'time saved estimate',
          'difficulty rating',
          'starter config',
        ],
      },
      who_its_for:
        "Founders, ops people, and agencies who want to see what an automation would actually look like before committing — and consultants who want to scope a client's pain point live.",
      build_potential:
        'Could generate import-ready Make and n8n blueprints, store a library of common process templates, and link straight into a build engagement.',
    },
    interest_context: 'automation-blueprint',
  },
  {
    id: 'website-roast',
    name: 'Website Roast Bot',
    status: 'live',
    category: 'AI / GTM',
    cats: ['ai', 'utilities'],
    short_description:
      'Drop a URL. Get a brutally honest roast of the site — copy, CTAs, SEO, mobile UX, and real Lighthouse scores — with 3 priority fixes.',
    tags: ['website', 'roast', 'audit', 'seo', 'ux', 'ai'],
    thumb: 'roast',
    launch_url: '/mini-apps/website-roast',
    learn_more: {
      what_it_does:
        'Scrapes any website, runs it through Google PageSpeed for real Lighthouse scores, and feeds everything to Claude for a brutally honest breakdown across 6 categories: copy quality, CTA clarity, SEO basics, mobile UX, performance, and trust signals.',
      how_it_works: {
        inputs: ['website URL'],
        outputs: [
          'overall score',
          '6 category scores',
          'roast per category',
          'lighthouse scores',
          '3 priority fixes',
        ],
      },
      who_its_for:
        "Founders, marketers, and agencies who want a fast honest audit of any site — their own or a competitor's.",
      build_potential:
        'Could become a full site audit tool with historical tracking, competitor comparison, and weekly automated reports.',
    },
    interest_context: 'website-roast',
  },
  {
    id: 'crm-sanity',
    name: 'CRM Field Sanity Check',
    status: 'live',
    category: 'AI / Operations',
    cats: ['ai', 'operations'],
    short_description:
      'Paste any CRM record. Get a data quality score, issue flags by severity, exact fixes, and duplicate risk in seconds.',
    tags: ['crm', 'data quality', 'hygiene', 'salesforce', 'hubspot', 'ai'],
    thumb: 'sanity',
    launch_url: '/mini-apps/crm-sanity',
    learn_more: {
      what_it_does:
        'Reads any pasted CRM record — contact, account, lead, or deal — and returns a 0–100 quality score, a list of issues ranked by severity (critical / warning / suggestion), an exact fix for each issue, clean field list, and a duplicate risk assessment.',
      how_it_works: {
        inputs: ['crm record (any format — key:value, CSV, JSON, free text)'],
        outputs: ['quality score', 'grade', 'issues + fixes', 'clean fields', 'duplicate risk'],
      },
      who_its_for:
        'RevOps, sales ops, and SDRs who want to catch bad data before it breaks automations, skews reporting, or causes missed follow-ups.',
      build_potential:
        'Could become a real-time CRM validation layer that runs on every record save via webhook.',
    },
    interest_context: 'crm-sanity',
  },
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
  {
    id: 'proposal-engine',
    name: 'Proposal Draft Engine',
    status: 'live',
    category: 'AI / Utilities',
    cats: ['ai', 'utilities'],
    short_description:
      'Paste a client brief or RFP. Get a full tailored proposal — scope, phases, stack, timeline, and a why-us section — in seconds.',
    tags: ['proposal', 'sales', 'ai', 'drafting', 'rfp'],
    thumb: 'proposal',
    launch_url: '/mini-apps/proposal-engine',
    learn_more: {
      what_it_does:
        'Reads a client brief, RFP, or job description and generates a structured project proposal with scope summary, suggested phases, tech stack recommendation, rough timeline, and a tailored why-us section seeded with S7 capabilities.',
      how_it_works: {
        inputs: ['client brief or RFP text', 'tone (formal / conversational / technical)'],
        outputs: ['scope', 'phases', 'tech stack', 'timeline', 'why S7'],
      },
      who_its_for:
        'S7 team members responding to inbound briefs or RFPs who want a solid first draft in seconds instead of starting from a blank doc.',
      build_potential:
        'Could become a full proposal management tool with version history, client-specific templates, and direct export to Google Docs or Notion.',
    },
    interest_context: 'proposal-engine',
  },
]

export function getAppById(id: string): MiniApp | undefined {
  return APPS.find((a) => a.id === id)
}
