export type AppStatus = 'live' | 'beta' | 'new' | 'prototype' | 'coming-soon'

export type AppThumb =
  | 'chat'
  | 'chart'
  | 'doc'
  | 'rows'
  | 'matrix'
  | 'policy'
  | 'kb'
  | 'brief'
  | 'report'
  | 'form'
  | 'fan'
  | 'portal'

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
  { id: 'documents', label: 'DOCUMENTS' },
  { id: 'dashboards', label: 'DASHBOARDS' },
  { id: 'calculators', label: 'CALCULATORS' },
  { id: 'data', label: 'DATA' },
  { id: 'operations', label: 'OPERATIONS' },
  { id: 'utilities', label: 'UTILITIES' },
  { id: 'experimental', label: 'EXPERIMENTAL' },
] as const

export const APPS: MiniApp[] = [
  {
    id: 'meet-ting',
    name: 'Meet-Ting',
    status: 'live',
    category: 'Operations / AI',
    cats: ['operations', 'ai'],
    short_description: 'AI scheduling that books meetings over email and WhatsApp.',
    tags: ['scheduling', 'email', 'whatsapp', 'ai'],
    thumb: 'chat',
    launch_url: 'https://meet-ting.com',
    learn_more: {
      what_it_does:
        'AI scheduling agent that handles back-and-forth booking over email and WhatsApp until a slot is confirmed.',
      how_it_works: {
        inputs: ['email', 'whatsapp', 'calendar'],
        outputs: ['booked slot', 'invite', 'confirmation'],
      },
      who_its_for: 'Teams that schedule a lot of meetings and lose hours to coordination overhead.',
      build_potential: 'Could become a full inbox-attached scheduling assistant.',
    },
    interest_context: 'meet-ting',
  },
  {
    id: 'vsignal',
    name: 'VSignal',
    status: 'live',
    category: 'Data / AI',
    cats: ['data', 'ai'],
    short_description: 'Real-time crypto price tracking and AI-generated trade signals.',
    tags: ['crypto', 'signals', 'real-time', 'alerts'],
    thumb: 'chart',
    launch_url: 'https://vsignal.ai',
    learn_more: {
      what_it_does:
        'Real-time price tracking with AI signal generation across configurable crypto pairs.',
      how_it_works: {
        inputs: ['pair', 'timeframe', 'indicators'],
        outputs: ['signal', 'confidence', 'alert'],
      },
      who_its_for: 'Crypto operators and trading desks who need fast, structured signal flow.',
      build_potential: 'Could become a full trading-signal desk for crypto operators.',
    },
    interest_context: 'vsignal',
  },
  {
    id: 'doc-intelligence',
    name: 'Document Intelligence Tester',
    status: 'beta',
    category: 'Documents / AI',
    cats: ['documents', 'ai'],
    short_description:
      'Upload a document and see structured extraction, summary and classification in action.',
    tags: ['pdf', 'extract', 'summary', 'table'],
    thumb: 'doc',
    launch_url: null,
    learn_more: {
      what_it_does:
        'Drop in a PDF and watch the system extract fields, classify the document, and summarise key sections.',
      how_it_works: {
        inputs: ['pdf', 'docx', 'scanned image'],
        outputs: ['fields', 'summary', 'classification'],
      },
      who_its_for: 'Operations and back-office teams handling structured document intake at scale.',
      build_potential: 'Could become a full document-intake pipeline for any team.',
    },
    interest_context: 'doc-intelligence',
  },
  {
    id: 'csv-cleanup',
    name: 'CSV Cleanup Studio',
    status: 'beta',
    category: 'Data / Utilities',
    cats: ['data', 'utilities'],
    short_description: 'Drop in messy spreadsheet data and preview cleaned, normalised outputs.',
    tags: ['csv', 'clean', 'format', 'export'],
    thumb: 'rows',
    launch_url: null,
    learn_more: {
      what_it_does:
        'Paste or drop a messy CSV, choose a target schema, and preview the cleaned and normalised output before export.',
      how_it_works: {
        inputs: ['csv', 'paste', 'upload'],
        outputs: ['clean csv', 'json', 'validated'],
      },
      who_its_for:
        'Ops teams who spend too much time wrangling spreadsheets before importing them.',
      build_potential: 'Could become a full data-quality console for ops teams.',
    },
    interest_context: 'csv-cleanup',
  },
  {
    id: 'decision-matrix',
    name: 'Decision Matrix Builder',
    status: 'new',
    category: 'Utilities / AI',
    cats: ['utilities', 'ai'],
    short_description:
      'Compare options using weighted criteria and generate a clear recommendation.',
    tags: ['score', 'rank', 'compare', 'export'],
    thumb: 'matrix',
    launch_url: null,
    learn_more: {
      what_it_does:
        'Define options and weighted criteria, score each cell, and let the matrix produce a ranked recommendation.',
      how_it_works: {
        inputs: ['options', 'criteria', 'weights'],
        outputs: ['scores', 'ranking', 'export'],
      },
      who_its_for:
        'Ops or product teams making structured trade-off decisions across multiple options.',
      build_potential: 'Could become a full decision-support tool for ops or product teams.',
    },
    interest_context: 'decision-matrix',
  },
  {
    id: 'policy-checker',
    name: 'Policy Checker',
    status: 'prototype',
    category: 'Documents / AI',
    cats: ['documents', 'ai'],
    short_description: 'Paste policy text and check it against configurable rules or requirements.',
    tags: ['rules', 'review', 'risk', 'flag'],
    thumb: 'policy',
    launch_url: null,
    learn_more: {
      what_it_does:
        'Configure a ruleset, paste any policy or contract text, and flag missing clauses or violations.',
      how_it_works: {
        inputs: ['policy text', 'rules', 'standards'],
        outputs: ['flagged sections', 'risk notes'],
      },
      who_its_for: 'Compliance, legal and risk teams reviewing policy documents at speed.',
      build_potential: 'Could become a full compliance review console.',
    },
    interest_context: 'policy-checker',
  },
  {
    id: 'kb-finder',
    name: 'Knowledge Base Finder',
    status: 'prototype',
    category: 'AI / Experimental',
    cats: ['ai', 'experimental'],
    short_description:
      'Ask a question and see how an internal knowledge search experience could work.',
    tags: ['search', 'answer', 'sources', 'chat'],
    thumb: 'kb',
    launch_url: null,
    learn_more: {
      what_it_does:
        'Type a question and watch matched sources light up, with a synthesised answer drafted alongside.',
      how_it_works: {
        inputs: ['query', 'context', 'scope'],
        outputs: ['answer', 'sources', 'confidence'],
      },
      who_its_for:
        'Support, ops and internal teams who need answers from scattered company knowledge.',
      build_potential: 'Could become a full internal knowledge assistant.',
    },
    interest_context: 'kb-finder',
  },
  {
    id: 'brief-generator',
    name: 'Brief Generator',
    status: 'coming-soon',
    category: 'AI / Utilities',
    cats: ['ai', 'utilities'],
    short_description: 'Turn rough notes into a structured brief, plan or project outline.',
    tags: ['brief', 'generate', 'structure', 'copy'],
    thumb: 'brief',
    launch_url: null,
    learn_more: {
      what_it_does:
        'Drop in messy notes or voice transcript and get a structured brief with headings, bullet points and next steps.',
      how_it_works: {
        inputs: ['notes', 'transcript', 'prompt'],
        outputs: ['brief', 'plan', 'outline'],
      },
      who_its_for: 'Planning teams turning rough thinking into shareable briefs.',
      build_potential: 'Could become a full briefing assistant for any planning team.',
    },
    interest_context: 'brief-generator',
  },
  {
    id: 'report-snapshot',
    name: 'Report Snapshot Builder',
    status: 'coming-soon',
    category: 'Dashboards / Data',
    cats: ['dashboards', 'data'],
    short_description: 'Convert a simple data input into a clean executive-style report card.',
    tags: ['dashboard', 'summary', 'charts', 'pdf'],
    thumb: 'report',
    launch_url: null,
    learn_more: {
      what_it_does:
        'Feed in a CSV or query result and generate a polished executive snapshot suitable for PDF export.',
      how_it_works: {
        inputs: ['csv', 'query', 'template'],
        outputs: ['report card', 'pdf', 'charts'],
      },
      who_its_for: 'Operators producing weekly or monthly snapshots for leadership.',
      build_potential: 'Could become a full lightweight BI-output engine.',
    },
    interest_context: 'report-snapshot',
  },
  {
    id: 'form-workflow',
    name: 'Form-to-Workflow Prototype',
    status: 'coming-soon',
    category: 'Utilities / Operations',
    cats: ['utilities', 'operations'],
    short_description:
      'Submit a structured request and see how it could route into a system or task queue.',
    tags: ['form', 'route', 'status', 'queue'],
    thumb: 'form',
    launch_url: null,
    learn_more: {
      what_it_does:
        'Configure form → routing → queue and watch a submitted request flow into the right place automatically.',
      how_it_works: {
        inputs: ['form fields', 'rules', 'target'],
        outputs: ['task', 'status', 'audit'],
      },
      who_its_for: 'Internal ops teams routing structured requests across people and systems.',
      build_potential: 'Could become a full request-routing layer for any internal ops team.',
    },
    interest_context: 'form-workflow',
  },
  {
    id: 'content-transformer',
    name: 'Content Transformer',
    status: 'coming-soon',
    category: 'AI / Utilities',
    cats: ['ai', 'utilities'],
    short_description:
      'Turn one piece of content into multiple useful formats, tones or summaries.',
    tags: ['rewrite', 'format', 'summary', 'variants'],
    thumb: 'fan',
    launch_url: null,
    learn_more: {
      what_it_does:
        'Paste any content and generate variants — short summary, long-form, social-style, with options for tone and target audience.',
      how_it_works: {
        inputs: ['content', 'tone', 'format'],
        outputs: ['variants', 'summary', 'rewrite'],
      },
      who_its_for: 'Marketing, content and comms teams repurposing one source into many formats.',
      build_potential: 'Could become a full multi-format content engine.',
    },
    interest_context: 'content-transformer',
  },
  {
    id: 'mini-portal',
    name: 'Mini Portal Preview',
    status: 'coming-soon',
    category: 'Utilities / Experimental',
    cats: ['utilities', 'experimental'],
    short_description:
      'Explore a small portal-style interface with login-state, records and actions.',
    tags: ['portal', 'ui', 'records', 'actions'],
    thumb: 'portal',
    launch_url: null,
    learn_more: {
      what_it_does:
        'A small portal showing what an internal interface could look like — login, records list, detail view and one or two actions.',
      how_it_works: {
        inputs: ['records', 'roles', 'actions'],
        outputs: ['portal ui', 'records', 'audit'],
      },
      who_its_for: 'Anyone evaluating what a lightweight internal portal could feel like.',
      build_potential: 'Could become a full internal portal for any business.',
    },
    interest_context: 'mini-portal',
  },
]

export function getAppById(id: string): MiniApp | undefined {
  return APPS.find((a) => a.id === id)
}
