export type MobileVariant =
  | 'header'
  | 'system7'
  | 'selection'
  | 'body'
  | 'accent'
  | 'terminator'
  | 'yellow-terminator'

export type MobileNode = {
  id: string
  title: string
  subtitle?: string
  variant: MobileVariant
}

export type MobileConnector = 'start' | 'linear' | 'fanout' | 'merge' | 'parallel'

export type MobileLevel = {
  level: number
  connector: MobileConnector
  nodes: MobileNode[]
}

export const SALES_MOBILE: MobileLevel[] = [
  {
    level: 0,
    connector: 'start',
    nodes: [
      {
        id: 'sales-header',
        title: 'Automated Outbound',
        subtitle: 'End-to-end outbound systems that book meetings for you.',
        variant: 'header',
      },
    ],
  },
  {
    level: 1,
    connector: 'linear',
    nodes: [{ id: 'sales-s7', title: 'System7', variant: 'system7' }],
  },
  {
    level: 2,
    connector: 'fanout',
    nodes: [
      { id: 'sales-icp', title: 'ICP Model', variant: 'selection' },
      { id: 'sales-tam', title: 'TAM Map', variant: 'selection' },
    ],
  },
  {
    level: 3,
    connector: 'merge',
    nodes: [
      {
        id: 'sales-infra',
        title: 'Email and LinkedIn Infrastructure',
        variant: 'body',
      },
    ],
  },
  {
    level: 4,
    connector: 'fanout',
    nodes: [
      { id: 'sales-play', title: 'Play Selection', variant: 'selection' },
      { id: 'sales-tool', title: 'Tool Selection', variant: 'selection' },
    ],
  },
  {
    level: 5,
    connector: 'parallel',
    nodes: [
      { id: 'sales-list', title: 'List Building', variant: 'body' },
      { id: 'sales-enrich', title: 'Data Enrichment', variant: 'body' },
      { id: 'sales-score', title: 'Lead Scoring', variant: 'body' },
      { id: 'sales-copy', title: 'Personalized Copywriting', variant: 'body' },
    ],
  },
  {
    level: 6,
    connector: 'merge',
    nodes: [{ id: 'sales-multi', title: 'Multichannel Outreach', variant: 'body' }],
  },
  {
    level: 7,
    connector: 'linear',
    nodes: [{ id: 'sales-qual', title: 'Qualified Leads', variant: 'body' }],
  },
  {
    level: 8,
    connector: 'fanout',
    nodes: [
      {
        id: 'sales-crm',
        title: 'CRM',
        subtitle: 'HubSpot · Salesforce',
        variant: 'terminator',
      },
      { id: 'sales-slack', title: 'Slack', variant: 'terminator' },
    ],
  },
]

export const MARKETING_MOBILE: MobileLevel[] = [
  {
    level: 0,
    connector: 'start',
    nodes: [
      {
        id: 'mkt-header',
        title: 'Content Engine',
        subtitle: 'LinkedIn thought leadership content engines that generate demand.',
        variant: 'header',
      },
    ],
  },
  {
    level: 1,
    connector: 'linear',
    nodes: [{ id: 'mkt-s7', title: 'System7.ai', variant: 'system7' }],
  },
  {
    level: 2,
    connector: 'linear',
    nodes: [{ id: 'mkt-icp', title: 'ICP Connection Requests', variant: 'body' }],
  },
  {
    level: 3,
    connector: 'linear',
    nodes: [{ id: 'mkt-cal', title: 'Content Calendar', variant: 'body' }],
  },
  {
    level: 4,
    connector: 'fanout',
    nodes: [
      { id: 'mkt-pillars', title: 'Content Pillars', variant: 'body' },
      { id: 'mkt-topics', title: 'Topics', variant: 'body' },
      { id: 'mkt-formats', title: 'Post Formats', variant: 'body' },
    ],
  },
  {
    level: 5,
    connector: 'merge',
    nodes: [{ id: 'mkt-interviews', title: 'Interviews', variant: 'body' }],
  },
  {
    level: 6,
    connector: 'linear',
    nodes: [{ id: 'mkt-creation', title: 'Content Creation', variant: 'body' }],
  },
  {
    level: 7,
    connector: 'fanout',
    nodes: [
      { id: 'mkt-thought', title: 'Thought Leadership', variant: 'body' },
      { id: 'mkt-edu', title: 'Educational', variant: 'body' },
      { id: 'mkt-product', title: 'Product Marketing', variant: 'body' },
      { id: 'mkt-enable', title: 'Sales Enablement', variant: 'body' },
      { id: 'mkt-proof', title: 'Social Proof', variant: 'body' },
    ],
  },
  {
    level: 8,
    connector: 'merge',
    nodes: [{ id: 'mkt-dist', title: 'Distribution', variant: 'accent' }],
  },
  {
    level: 9,
    connector: 'fanout',
    nodes: [
      { id: 'mkt-inbound', title: 'Inbound Meetings', variant: 'terminator' },
      { id: 'mkt-trials', title: 'Free Trials', variant: 'terminator' },
    ],
  },
]

export const REVOPS_MOBILE: MobileLevel[] = [
  {
    level: 0,
    connector: 'start',
    nodes: [
      {
        id: 'rev-header',
        title: 'AI RevOps',
        subtitle:
          'AI workflows that help your sales, marketing, product and customer support teams work efficiently.',
        variant: 'header',
      },
    ],
  },
  {
    level: 1,
    connector: 'linear',
    nodes: [
      {
        id: 'rev-s7',
        title: 'System7',
        subtitle: 'Runs three parallel pipelines — Outbound, CRM, Inbound.',
        variant: 'system7',
      },
    ],
  },
  {
    level: 2,
    connector: 'fanout',
    nodes: [
      {
        id: 'rev-tam',
        title: 'TAM Sourcing',
        subtitle: '30+ data sources, web scraping.',
        variant: 'body',
      },
      { id: 'rev-crm', title: 'CRM Records', variant: 'body' },
      {
        id: 'rev-inbound',
        title: 'Inbound',
        subtitle: 'Phone, forms, visitors, socials, webinars.',
        variant: 'body',
      },
    ],
  },
  {
    level: 3,
    connector: 'merge',
    nodes: [
      {
        id: 'rev-ai',
        title: 'AI Account Research',
        subtitle: '100+ data providers, AI agents.',
        variant: 'body',
      },
    ],
  },
  {
    level: 4,
    connector: 'fanout',
    nodes: [
      { id: 'rev-signals', title: 'Custom Signals', variant: 'body' },
      { id: 'rev-dedupe', title: 'Dedupe & Associate', variant: 'body' },
      { id: 'rev-score1', title: 'Lead Scoring', variant: 'body' },
    ],
  },
  {
    level: 5,
    connector: 'parallel',
    nodes: [
      { id: 'rev-score2', title: 'Lead Scoring', variant: 'body' },
      { id: 'rev-segment', title: 'Score & Segment', variant: 'body' },
      { id: 'rev-route', title: 'Lead Routing', variant: 'body' },
    ],
  },
  {
    level: 6,
    connector: 'parallel',
    nodes: [
      { id: 'rev-alloc', title: 'Lead Allocation', variant: 'yellow-terminator' },
      { id: 'rev-update', title: 'Update Records', variant: 'yellow-terminator' },
      {
        id: 'rev-outreach',
        title: 'Personalized Outreach',
        variant: 'yellow-terminator',
      },
    ],
  },
]
