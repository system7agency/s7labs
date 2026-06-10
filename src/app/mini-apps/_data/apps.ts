// `draft` is an internal QA-tracking status used during the design-system
// migration: the app is fully usable and launches normally, but the card shows
// a DRAFT badge so we can see at a glance which apps have not yet been reviewed
// and flipped to `live`. It has no effect on whether the app works.
export type AppStatus = 'live' | 'beta' | 'new' | 'prototype' | 'coming-soon' | 'draft'

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
  | 'agentic'
  | 'aio'
  | 'avs'
  | 'bulkemail'
  | 'campaign'
  | 'emailopt'
  | 'flywheel'
  | 'intents'
  | 'liprofile'
  | 'roi'
  | 'techfind'

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
  /** Developer initials. Shown on the card only in non-production builds
   * (i.e. `npm run dev`) so the team can see who owns each app at a glance. */
  author?: string
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
    id: 'agentic-readiness',
    name: 'Agentic Readiness Checker',
    status: 'live',
    category: 'Software / AI',
    cats: ['ai', 'gtm'],
    short_description:
      'Check whether an AI agent can actually read and act on your site. Free result shows your biggest blockers and a readiness score; the full 6-point checklist and ranked fix plan unlock by email.',
    tags: ['ai agents', 'structured data', 'seo', 'readiness', 'gtm', 'ai'],
    thumb: 'agentic',
    launch_url: '/mini-apps/agentic-readiness',
    learn_more: {
      what_it_does:
        'Scrapes a website and assesses how ready it is for AI agents and LLM crawlers to read it and act on it — across structured data, content clarity, crawl access, render dependency, action readiness, and identity signals. It shows a readiness score and the biggest blockers free, and unlocks the full checklist, the specific fix for each issue, and a ranked action plan by email.',
      how_it_works: {
        inputs: ['website URL'],
        outputs: [
          'agentic readiness score',
          '1-2 free blockers',
          'full 6-point checklist',
          'specific fix per issue',
          'prioritised fix plan',
          'quick wins',
        ],
      },
      who_its_for:
        "Brands, marketers, and agencies who want to know whether AI agents can use their site — a problem most don't know they have yet, ahead of where the market is heading.",
      build_potential:
        'Could re-scan on a schedule to track readiness over time, diff against competitors, validate fixes after deploy, and generate the structured-data snippets needed to fix each issue.',
    },
    interest_context: 'agentic-readiness',
  },
  {
    id: 'ai-overview-tracker',
    name: 'AI Overview Tracker',
    status: 'draft',
    category: 'Software / AI',
    cats: ['ai', 'gtm'],
    short_description:
      'Not a rank tracker. Checks which keywords trigger a Google AI Overview, who gets cited, and whether your brand shows up — free snapshot, full per-keyword breakdown by email.',
    tags: ['ai overview', 'seo', 'citations', 'gtm', 'aio', 'ai'],
    thumb: 'aio',
    launch_url: '/mini-apps/ai-overview-tracker',
    learn_more: {
      what_it_does:
        'Runs your keywords through Google search, detects which ones trigger an AI Overview, and checks who gets cited in the AI answer — including whether your brand is there. It shows your AI Overview trigger rate, citation rate, and blind spots free, then unlocks the full per-keyword citation breakdown by email.',
      how_it_works: {
        inputs: ['your domain', 'up to 5 keywords', 'market/location'],
        outputs: [
          'AI Overview trigger rate',
          'citation rate',
          'blind spots and ghost keywords',
          'per-keyword citation breakdown',
          'who gets cited instead of you',
          '3 ways to get cited',
        ],
      },
      who_its_for:
        "Brands, marketers, and agencies who need to know if Google's AI answers cite them — the gap rank trackers don't show.",
      build_potential:
        'Track citation share over time, competitor leaderboards, and scheduled weekly re-checks with change alerts.',
    },
    interest_context: 'ai-overview-tracker',
  },
  {
    id: 'ai-visibility-score',
    name: 'AI Visibility Score',
    status: 'draft',
    category: 'Software / AI',
    cats: ['ai', 'gtm'],
    short_description:
      'One 0-100 score for how visible your brand is to AI — built from presence in AI answers, citations, entity clarity, and drift. See your score and the four sub-scores, then unlock what is dragging it down.',
    tags: ['ai visibility', 'aeo', 'citations', 'entity', 'gtm', 'ai'],
    thumb: 'avs',
    launch_url: '/mini-apps/ai-visibility-score',
    learn_more: {
      what_it_does:
        'Calculates a single AI Visibility Score (0-100) for a domain from four parts — presence in AI answers, citations as a source, entity clarity, and drift — and shows the score and sub-scores, then unlocks a short read of what is pulling the score down.',
      how_it_works: {
        inputs: ['your domain'],
        outputs: [
          'AI Visibility Score (0-100)',
          'four sub-scores',
          'what is dragging it down',
          'what to fix',
        ],
      },
      who_its_for:
        'Brands, marketers, and agencies who want one defensible number for how visible they are to AI — and a metric to be measured against over time.',
      build_potential:
        'The internal version gives free fix recommendations and a paid roadmap, tracks AVS over time per client from stored snapshots, and turns drift into an alerting trend.',
    },
    interest_context: 'ai-visibility-score',
  },
  {
    id: 'email-copy-optimizer',
    name: 'Email Copy Optimizer',
    status: 'draft',
    category: 'AI / GTM',
    cats: ['ai', 'gtm', 'operations'],
    short_description:
      'Paste a cold email and get three optimized rewrites — each with a different angle, annotated changes, and a quality diagnosis.',
    tags: ['email', 'copywriting', 'outbound', 'cold email', 'ai'],
    thumb: 'emailopt',
    launch_url: '/mini-apps/email-copy-optimizer',
    learn_more: {
      what_it_does:
        'Reads your cold email subject and body, scores weak points, and rewrites it into three distinct variations (e.g. direct, curiosity-led, value-first) with annotated explanations of what changed and why.',
      how_it_works: {
        inputs: ['email subject', 'email body', 'optional goal / audience / tone'],
        outputs: [
          'quality score and issues list',
          '3 optimized variations',
          'annotated changes per variation',
          'copy-to-clipboard per variation',
        ],
      },
      who_its_for:
        'SDRs, AEs, and founders who want stronger cold email copy without spending an hour rewriting the same message three ways.',
      build_potential:
        'Could learn from reply rates, A/B test variations in a sequencer, and generate follow-up sequences from the winning angle.',
    },
    interest_context: 'email-copy-optimizer',
  },
  {
    id: 'roi-calculator',
    name: 'ROI Calculator',
    status: 'draft',
    category: 'AI / GTM',
    cats: ['ai', 'gtm', 'operations'],
    short_description:
      'Model outbound campaign inputs and see expected pipeline, closed revenue, ROI multiple, and cost per meeting — live as you move the sliders.',
    tags: ['roi', 'outbound', 'pipeline', 'calculator', 'gtm'],
    thumb: 'roi',
    launch_url: '/mini-apps/roi-calculator',
    learn_more: {
      what_it_does:
        'Takes leads contacted, reply rate, meeting conversion, close rate, average deal size, and campaign cost — then calculates pipeline value, expected revenue, ROI, and cost efficiency metrics with a visual funnel breakdown.',
      how_it_works: {
        inputs: [
          'leads contacted',
          'reply rate %',
          'meeting conversion %',
          'deal close rate %',
          'avg deal size',
          'campaign cost',
        ],
        outputs: [
          'pipeline value',
          'expected closed revenue',
          'ROI multiple',
          'cost per meeting',
          'cost per deal',
          'what-if sensitivity line',
        ],
      },
      who_its_for:
        'RevOps leaders, founders, and GTM teams who need a quick, defensible ROI model before scaling outbound spend.',
      build_potential:
        'Could save scenarios per client, benchmark against industry averages, and connect to live CRM data for actual vs projected.',
    },
    interest_context: 'roi-calculator',
  },
  {
    id: 'tech-stack-finder',
    name: 'Tech Stack Finder',
    status: 'draft',
    category: 'Software / AI',
    cats: ['ai', 'gtm', 'software'],
    short_description:
      'Enter a company domain and get its technology stack grouped by category — analytics, CMS, hosting, CRM, ads, and more.',
    tags: ['tech stack', 'enrichment', 'competitive intel', 'gtm', 'ai'],
    thumb: 'techfind',
    launch_url: '/mini-apps/tech-stack-finder',
    learn_more: {
      what_it_does:
        'Fingerprints a company website and returns detected technologies organized into standard categories with logos — useful for competitive research and outbound personalization.',
      how_it_works: {
        inputs: ['company domain'],
        outputs: ['categorized tech stack', 'technology logos', 'total technologies detected'],
      },
      who_its_for:
        'SDRs, marketers, and agencies researching prospects or competitors who need to know what tools a company runs before pitching.',
      build_potential:
        'Could diff stacks over time, alert on competitor tech changes, and personalize outreach based on detected tools.',
    },
    interest_context: 'tech-stack-finder',
  },
  {
    id: 'share-of-voice',
    author: 'SK',
    name: 'AI Share of Voice Scorer',
    status: 'draft',
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
    author: 'SK',
    name: 'Tech Stack Recommender',
    status: 'draft',
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
    author: 'SK',
    name: 'Automation Blueprint',
    status: 'draft',
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
    author: 'YA',
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
    author: 'YA',
    name: 'CRM Field Sanity Check',
    status: 'draft',
    category: 'AI / Operations',
    cats: ['ai', 'operations'],
    short_description:
      'Paste one CRM record. Get a data quality score, issue flags by severity, exact fixes, and duplicate risk in seconds.',
    tags: ['crm', 'data quality', 'hygiene', 'salesforce', 'hubspot', 'ai'],
    thumb: 'sanity',
    launch_url: '/mini-apps/crm-sanity',
    learn_more: {
      what_it_does:
        'Reads one pasted CRM record (a contact, account, lead, or deal) and returns a 0–100 quality score, a list of issues ranked by severity (critical / warning / suggestion), an exact fix for each issue, clean field list, and a duplicate risk assessment. One record at a time, not bulk.',
      how_it_works: {
        inputs: ['one crm record (any format: key:value, CSV row, JSON, free text)'],
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
    author: 'YA',
    name: 'Job Posting to Sales Brief',
    status: 'draft',
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
    author: 'YA',
    name: 'LinkedIn Post to Outbound Hook',
    status: 'draft',
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
    id: 'email-finder',
    author: 'YA',
    name: 'Email Finder',
    status: 'draft',
    category: 'AI / GTM',
    cats: ['ai', 'gtm', 'operations'],
    short_description:
      'Enter a name and company. Get back a verified work email with a confidence score and the metadata to back it up.',
    tags: ['email', 'finder', 'apollo', 'outbound', 'ai'],
    thumb: 'hook',
    launch_url: '/mini-apps/email-finder',
    learn_more: {
      what_it_does:
        'Matches a person against Apollo’s 200M+ contact database using their name and company (domain or LinkedIn URL). Returns the verified business email, confidence score, title, and LinkedIn URL — ready to drop into a sequencer.',
      how_it_works: {
        inputs: ['full name', 'company domain or LinkedIn URL'],
        outputs: ['verified email', 'confidence score', 'title', 'company domain', 'linkedin url'],
      },
      who_its_for:
        'SDRs, AEs, founders, and recruiters who need a working email address for a specific person — without paying for a full Apollo seat.',
      build_potential:
        'Could become a Chrome extension that finds emails inline on LinkedIn, or batch lookup for an uploaded list of names.',
    },
    interest_context: 'email-finder',
  },
  {
    id: 'bulk-email-finder',
    name: 'Bulk Email Finder',
    status: 'draft',
    category: 'AI / GTM',
    cats: ['ai', 'gtm', 'operations'],
    short_description:
      'Upload a CSV of names and companies — get back a downloadable list with verified work emails appended (free: 50 rows per run).',
    tags: ['email', 'bulk', 'csv', 'apollo', 'outbound', 'ai'],
    thumb: 'bulkemail',
    launch_url: '/mini-apps/bulk-email-finder',
    learn_more: {
      what_it_does:
        'Parses a CSV of prospects, maps name and company columns, enriches each row with a verified business email and verification status, then lets you download the enriched file.',
      how_it_works: {
        inputs: ['CSV with name + company columns'],
        outputs: [
          'verified email per row',
          'verification status',
          'downloadable enriched CSV',
          'found / not found summary',
        ],
      },
      who_its_for:
        'SDRs and recruiters with a prospect list who need emails in bulk without manually running single lookups.',
      build_potential:
        'Could integrate with CRM import, scheduled re-verification, and higher row limits for paid tiers.',
    },
    interest_context: 'bulk-email-finder',
  },
  {
    id: 'find-people',
    author: 'YA',
    name: 'Find People',
    status: 'draft',
    category: 'AI / GTM',
    cats: ['ai', 'gtm', 'operations'],
    short_description:
      'Enter a company. Get a live roster of employees with their roles, departments, and LinkedIn URLs.',
    tags: ['people', 'finder', 'apollo', 'outbound', 'abm', 'ai'],
    thumb: 'sov',
    launch_url: '/mini-apps/find-people',
    learn_more: {
      what_it_does:
        'Pulls an employee roster for any company from a 200M+ contact graph and lets you filter by seniority and department. Designed for buying-committee mapping, ABM list building, and outbound targeting — without paying for a full Apollo seat.',
      how_it_works: {
        inputs: ['company name or domain'],
        outputs: [
          'employee roster',
          'seniority + department filters',
          'LinkedIn URLs',
          'pagination',
        ],
      },
      who_its_for:
        'SDRs, AEs, founders, and recruiters who need a fast picture of who actually works at a target company before they start outreach.',
      build_potential:
        'Could become a Chrome extension that surfaces the roster inline on a company’s website, or batch lookup for an uploaded list of accounts.',
    },
    interest_context: 'find-people',
  },
  {
    id: 'campaign-ideation',
    author: 'YA',
    name: 'Campaign Ideation',
    status: 'draft',
    category: 'AI / GTM',
    cats: ['ai', 'gtm'],
    short_description:
      'Describe your product, audience, and goal. Get seven specific GTM campaign ideas with hooks, channels, formats, and first steps.',
    tags: ['campaign', 'gtm', 'strategy', 'copy', 'ai'],
    thumb: 'campaign',
    launch_url: '/mini-apps/campaign-ideation',
    learn_more: {
      what_it_does:
        'Turns a product brief into seven channel-specific campaign ideas — each with a memorable name, hook, channels, format, first step, expected outcome, and effort level — plus a positioning summary reflecting what it understood.',
      how_it_works: {
        inputs: [
          'product description',
          'target audience',
          'current motion (optional)',
          'goal (optional)',
        ],
        outputs: [
          'positioning summary',
          '7 campaign ideas',
          'hooks and channels per idea',
          'first steps and expected outcomes',
        ],
      },
      who_its_for:
        'Founders and GTM teams who need fresh campaign angles tied to their actual product — not generic playbooks.',
      build_potential:
        'Could save briefs, pair with ROI Calculator scenarios, and generate full launch copy per idea.',
    },
    interest_context: 'campaign-ideation',
  },
  {
    id: 'gtm-flywheel',
    author: 'YA',
    name: 'GTM Flywheel',
    status: 'draft',
    category: 'AI / GTM',
    cats: ['ai', 'gtm', 'software'],
    short_description:
      'Drag GTM motions onto a canvas, connect them into a compounding loop, and share your flywheel as a link or PNG — free to build, email to export.',
    tags: ['gtm', 'strategy', 'flywheel', 'canvas', 'visual'],
    thumb: 'flywheel',
    launch_url: '/mini-apps/gtm-flywheel',
    learn_more: {
      what_it_does:
        'An interactive canvas for mapping how inbound, outbound, content, partnerships, and other motions feed each other over time. Build from a template or scratch, connect nodes with directional edges, and export a shareable link or PNG.',
      how_it_works: {
        inputs: ['GTM motion library', 'custom labels and notes', 'connections between motions'],
        outputs: ['visual flywheel map', 'shareable URL', 'PNG export'],
      },
      who_its_for:
        'Founders and GTM leaders who need to visualize how their motions compound — and share that story with the team or board.',
      build_potential:
        'Could add AI-suggested connections, team collaboration, and CRM-linked motion health scores.',
    },
    interest_context: 'gtm-flywheel',
  },
  {
    id: 'intent-signals',
    author: 'YA',
    name: 'Intent Signals',
    status: 'draft',
    category: 'AI / Operations',
    cats: ['ai', 'operations', 'gtm'],
    short_description:
      'Enter a company domain. Get ranked buying intent signals — hiring, funding, leadership, tech — with sources and a ready outreach angle.',
    tags: ['intent', 'signals', 'outbound', 'hiring', 'gtm', 'ai'],
    thumb: 'intents',
    launch_url: '/mini-apps/intent-signals',
    learn_more: {
      what_it_does:
        'Scans public sources for hiring spikes, news events, and tech adoption signals, then ranks them into an intent score with a suggested outreach opener — assembled from public data, not enterprise intent vendors.',
      how_it_works: {
        inputs: ['company domain'],
        outputs: [
          'intent score (0-100)',
          'ranked signal feed with sources',
          'strength chips (hot / warm / background)',
          'suggested outreach angle',
        ],
      },
      who_its_for:
        'SDRs, AEs, and founders who want evidence-based context on whether a target account is "in motion" before outreach.',
      build_potential:
        'Collector architecture supports swapping in paid intent vendors; could merge with Outbound Trigger Radar and add scheduled re-scans.',
    },
    interest_context: 'intent-signals',
  },
  {
    id: 'linkedin-profile-reviewer',
    author: 'YA',
    name: 'LinkedIn Profile Reviewer',
    status: 'draft',
    category: 'AI / GTM',
    cats: ['ai', 'gtm'],
    short_description:
      'Paste a LinkedIn profile URL or copy-paste your profile text. Get a scored review with rewrite-ready tips for headline, About, experience, and more.',
    tags: ['linkedin', 'profile', 'personal brand', 'gtm', 'ai'],
    thumb: 'liprofile',
    launch_url: '/mini-apps/linkedin-profile-reviewer',
    learn_more: {
      what_it_does:
        'Reviews a LinkedIn profile from a URL scrape or pasted text, scores each section (headline, About, experience, skills, recommendations, photo & banner), and returns five ranked actions with specific rewrite-ready suggestions.',
      how_it_works: {
        inputs: ['LinkedIn profile URL or pasted profile text'],
        outputs: [
          'overall profile score',
          'section scores and verdicts',
          'rewrite-ready suggestions',
          'top 5 ranked actions',
        ],
      },
      who_its_for:
        'Founders, sellers, and marketers who want a fast, honest LinkedIn audit with concrete copy improvements — not generic advice.',
      build_potential:
        'Could track score over time, compare against role benchmarks, and generate full section rewrites on demand.',
    },
    interest_context: 'linkedin-profile-reviewer',
  },
  {
    id: 'outbound-radar',
    author: 'YA',
    name: 'Outbound Trigger Radar',
    status: 'draft',
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
    author: 'YA',
    name: 'Pricing Page Diagnostic',
    status: 'draft',
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
    author: 'SK',
    name: 'Proposal Draft Engine',
    status: 'draft',
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
