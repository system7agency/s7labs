'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'

import styles from './CapabilitiesSection.module.css'
import { AiRevOpsFlowChart } from './AiRevOpsFlowChart'
import { AutomatedOutboundFlowChart } from './AutomatedOutboundFlowChart'
import { SalesGtmFlowChart } from './SalesGtmFlowChart'
import { MobileFlowTimeline } from './MobileFlowTimeline'
import { MARKETING_MOBILE, REVOPS_MOBILE, SALES_MOBILE } from './mobileFlowData'
import { useFlowBuildAnimation } from './useFlowBuildAnimation'

const FLOW_COORDS: Record<'sales' | 'marketing' | 'revops', string> = {
  sales: '1260 × 2030',
  marketing: '1490 × 2160',
  revops: '1700 × 1420',
}

const FLOW_CHART_KEYS = new Set<Capability['key']>(['sales', 'marketing', 'revops'])

type Capability = {
  key: 'sales' | 'marketing' | 'revops'
  capVar: string
  index: string
  eyebrow: string
  title: string
  desc: string
  meta: string
  backTag: string
  list: string[]
  glyph: ReactNode
  modal: {
    eyebrow: string
    title: string
    sub: string
    meta: [string, string][]
    primary: string
    secondary: string
  }
}

const CAPABILITIES: Capability[] = [
  {
    key: 'sales',
    capVar: 'var(--c-blue)',
    index: '02',
    eyebrow: 'MANUAL → AUTOMATED',
    title: 'Sales / GTM',
    desc: 'We make your go-to-market motion more efficient end to end, from the first outbound touch through to inbound follow-up. The job is to pick the right tools, wire them into a single system, and run them as one optimised GTM stack instead of a scatter of disconnected apps.',
    meta: 'SALES · GTM',
    backTag: '// 02 CAPABILITIES',
    list: [
      'AI co-pilots that clear the repetitive work',
      'Total addressable market mapped and deeply enriched',
      'Account and prospect research led by AI',
      'Personalised outbound that runs itself',
      'Outreach across email and LinkedIn, automated',
      'Inbox health and deliverability tuned',
      'Inbound leads qualified and tidied up',
      'Automation through the middle of the funnel',
      'Meeting prep handled before every call',
      'Competitor intelligence in real time',
      'Sales and GTM builds made to order',
    ],
    glyph: (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 30 L18 18 L26 26 L42 10" />
        <path d="M30 10 L42 10 L42 22" />
        <circle cx="6" cy="30" r="2.2" fill="currentColor" />
        <circle cx="18" cy="18" r="2.2" fill="currentColor" />
        <circle cx="26" cy="26" r="2.2" fill="currentColor" />
      </svg>
    ),
    modal: {
      eyebrow: 'CAPABILITY · 02 / SALES & GTM',
      title: 'Outbound that compounds',
      sub: 'Connect every signal - intent, fit, behaviour - to a sequenced motion that reaches the right account at the right moment, without the manual reps in between.',
      meta: [
        ['STATUS', 'LIVE'],
        ['SCOPE', 'OUTBOUND · ENRICHMENT · SEQUENCING'],
        ['ENGINE', 'S7 / GTM-CORE'],
      ],
      primary: '#sales-demo',
      secondary: '#sales-brief',
    },
  },
  {
    key: 'marketing',
    capVar: 'var(--c-purple)',
    index: '03',
    eyebrow: 'ACTIVITY → PIPELINE',
    title: 'Marketing / Growth',
    desc: 'We take the data your marketing already produces and turn it into something sales can act on. Activity from ads, webinars, events and email stops sitting in dashboards and starts triggering the next step on its own.',
    meta: 'MARKETING · GROWTH',
    backTag: '// 03 CAPABILITIES',
    list: [
      'Inbound leads enriched as they arrive',
      'In-depth ICP and account research',
      'Accounts scored and routed to the right owner',
      'Outbound fired off the back of inbound activity',
      'Audiences built for paid campaigns',
      'Landing pages produced at scale',
      'Website visitors identified',
      'Social and competitor activity monitored',
      'Event and conference follow-up, automated',
      'Marketing and growth builds made to order',
    ],
    glyph: (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M8 30 L20 14 L24 22 L34 10" />
        <path d="M34 10 L34 18" />
        <path d="M34 10 L26 12" />
        <path d="M14 38 L26 24 L30 30 L42 18" />
        <path d="M42 18 L42 26" />
        <path d="M42 18 L34 20" />
      </svg>
    ),
    modal: {
      eyebrow: 'CAPABILITY · 03 / MARKETING & GROWTH',
      title: 'Demand, not noise',
      sub: 'Programmatic content engines, attribution that survives ad-blockers, and visitor-level intelligence - wired into the same pipeline that closes revenue.',
      meta: [
        ['STATUS', 'LIVE'],
        ['SCOPE', 'CONTENT · ATTRIBUTION · VISITOR ID'],
        ['ENGINE', 'S7 / DEMAND-CORE'],
      ],
      primary: '#marketing-demo',
      secondary: '#marketing-brief',
    },
  },
  {
    key: 'revops',
    capVar: 'var(--c-orange)',
    index: '01',
    eyebrow: 'DATA → SOURCE OF TRUTH',
    title: 'RevOps',
    desc: 'A CRM is only as useful as the data inside it, and automation raises the stakes. We turn yours into a dependable source of truth - clean, structured and ready to automate - so every system that runs on top of it can be trusted.',
    meta: 'REVOPS · CRM',
    backTag: '// 01 CAPABILITIES',
    list: [
      'Record clean-up and duplicate removal',
      'Fields standardised and kept consistent',
      'Automatic enrichment as records land',
      'Research across accounts, contacts and leads',
      'Lead and account scoring, native to your CRM',
      'Pipeline and campaign data updated without manual effort',
      'RevOps builds made to order',
    ],
    glyph: (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="6" y="14" width="12" height="26" rx="1.5" />
        <rect x="20" y="8" width="12" height="32" rx="1.5" />
        <rect x="34" y="20" width="8" height="20" rx="1.5" />
        <path d="M10 22 L14 22 M10 28 L14 28 M24 16 L28 16 M24 24 L28 24 M24 32 L28 32 M36 26 L40 26" />
        <circle cx="38" cy="14" r="2.4" fill="currentColor" />
      </svg>
    ),
    modal: {
      eyebrow: 'CAPABILITY · 01 / REVOPS',
      title: 'The system underneath the system',
      sub: 'CRM, dashboards, lead routing, custom requests - re-engineered as a single instrument panel that operators can actually steer.',
      meta: [
        ['STATUS', 'LIVE'],
        ['SCOPE', 'CRM · ROUTING · DASHBOARDS'],
        ['ENGINE', 'S7 / OPS-CORE'],
      ],
      primary: '#revops-demo',
      secondary: '#revops-brief',
    },
  },
]

// Display order per the RevOps update: RevOps first, then Sales/GTM, then Marketing.
const CAP_ORDER: Capability['key'][] = ['revops', 'sales', 'marketing']
const ORDERED_CAPABILITIES: Capability[] = CAP_ORDER.map((k) =>
  CAPABILITIES.find((c) => c.key === k)
).filter((c): c is Capability => c !== undefined)

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    const sync = () => setIsMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  return isMobile
}

export function CapabilitiesSection() {
  const [activeKey, setActiveKey] = useState<Capability['key'] | null>(null)
  const isMobile = useIsMobile()
  const lastFocusRef = useRef<HTMLElement | null>(null)
  const primaryBtnRef = useRef<HTMLAnchorElement | null>(null)
  const flowWrapRef = useRef<HTMLDivElement | null>(null)
  const active = activeKey ? (CAPABILITIES.find((c) => c.key === activeKey) ?? null) : null
  const isFlow = active ? FLOW_CHART_KEYS.has(active.key) : false

  useFlowBuildAnimation(flowWrapRef, {
    active: isFlow,
    replayKey: `${activeKey ?? ''}:${isMobile ? 'm' : 'd'}`,
    inClassName: styles.in ?? '',
    livePulseClassName: styles.livePulse ?? '',
    nodeClassName: styles.flowNode ?? '',
  })

  const close = useCallback(() => {
    setActiveKey(null)
  }, [])

  useEffect(() => {
    if (!active) {
      document.body.style.overflow = ''
      if (lastFocusRef.current) {
        lastFocusRef.current.focus()
        lastFocusRef.current = null
      }
      return
    }
    document.body.style.overflow = 'hidden'
    const t = window.setTimeout(() => primaryBtnRef.current?.focus(), 60)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(t)
      document.removeEventListener('keydown', onKey)
    }
  }, [active, close])

  const openFor = (key: Capability['key'], e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    lastFocusRef.current = e.currentTarget as unknown as HTMLElement
    setActiveKey(key)
  }

  return (
    <section className="section" aria-label="Capabilities">
      <div className="section-head">
        <span className="section-eyebrow">
          <span className="accent-dot" />
          {'// CAPABILITIES'}
        </span>
        <span className="section-num">
          03 CATEGORIES · <span className="v">LIVE</span>
        </span>
      </div>

      <div className={styles.capsGrid}>
        {ORDERED_CAPABILITIES.map((cap) => (
          <article
            key={cap.index}
            className={styles.capCard}
            tabIndex={0}
            style={{ ['--cap-c' as string]: cap.capVar } as CSSProperties}
          >
            <div className={styles.capFlip}>
              <div className={styles.capFace}>
                <span className={`${styles.corner} ${styles.cornerTl}`} />
                <span className={`${styles.corner} ${styles.cornerBr}`} />
                <span className={styles.flipHint}>
                  <span className={styles.h} />
                  HOVER
                </span>
                <div className={styles.figure}>
                  <div className={styles.figureStack}>
                    <div className={styles.glyph}>
                      <span className={styles.glyphPulse} />
                      {cap.glyph}
                    </div>
                    <span className={styles.figureMeta}>
                      <span className={styles.d} />
                      {cap.meta}
                    </span>
                  </div>
                </div>
                <div className={styles.body}>
                  <span className={styles.eyebrow}>
                    <span className={styles.num}>{cap.index}</span> · {cap.eyebrow}
                  </span>
                  <h3 className={styles.title}>{cap.title}</h3>
                  <p className={styles.desc}>{cap.desc}</p>
                </div>
              </div>

              <div className={`${styles.capFace} ${styles.capFaceBack}`}>
                <span className={`${styles.corner} ${styles.cornerTl}`} />
                <span className={`${styles.corner} ${styles.cornerBr}`} />
                <div className={styles.backHead}>
                  <h3 className={styles.backTitle}>{cap.title}</h3>
                  <span className={styles.backTag}>{cap.backTag}</span>
                </div>
                <ul className={styles.list}>
                  {cap.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <a
                  href="#"
                  className={styles.cta}
                  onClick={(e) => openFor(cap.key, e)}
                  aria-haspopup="dialog"
                  aria-controls="cap-modal"
                >
                  <span>View Live</span>
                  <span className={styles.arr}>→</span>
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div
        id="cap-modal"
        className={`${styles.modalBackdrop} ${active ? styles.open : ''}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={active ? 'false' : 'true'}
        aria-label={active ? active.modal.title : undefined}
        onClick={(e) => {
          if (e.target === e.currentTarget) close()
        }}
        style={active ? ({ ['--cap-c' as string]: active.capVar } as CSSProperties) : undefined}
      >
        {active && (
          <div
            className={`${styles.modal} ${FLOW_CHART_KEYS.has(active.key) ? styles.modalWide : ''}`}
            role="document"
          >
            <span className={`${styles.corner} ${styles.cornerTl}`} />
            <span className={`${styles.corner} ${styles.cornerTr}`} />
            <span className={`${styles.corner} ${styles.cornerBl}`} />
            <span className={`${styles.corner} ${styles.cornerBr}`} />
            <button type="button" className={styles.modalClose} onClick={close} aria-label="Close">
              ×
            </button>
            <div className={styles.modalEyebrow}>
              <span className={styles.d} />
              <span>{active.modal.eyebrow}</span>
            </div>
            {!FLOW_CHART_KEYS.has(active.key) && (
              <>
                <h3>{active.modal.title}</h3>
                <p className={styles.modalSub}>{active.modal.sub}</p>
              </>
            )}
            {FLOW_CHART_KEYS.has(active.key) && (
              <div className={`${styles.flowWrap} ${styles.flowStage}`} ref={flowWrapRef}>
                <span className={styles.flowStageLabel}>{'// FLOW · LIVE'}</span>
                {!isMobile && (
                  <span className={styles.flowStageCoords}>{FLOW_COORDS[active.key]}</span>
                )}
                <div className={`${styles.flowScroll} ${isMobile ? styles.flowScrollMobile : ''}`}>
                  <div className={styles.flowFrame}>
                    {isMobile ? (
                      <>
                        {active.key === 'sales' && (
                          <MobileFlowTimeline levels={SALES_MOBILE} markerId="mobile-arrow-sales" />
                        )}
                        {active.key === 'marketing' && (
                          <MobileFlowTimeline
                            levels={MARKETING_MOBILE}
                            markerId="mobile-arrow-marketing"
                          />
                        )}
                        {active.key === 'revops' && (
                          <MobileFlowTimeline
                            levels={REVOPS_MOBILE}
                            markerId="mobile-arrow-revops"
                          />
                        )}
                      </>
                    ) : (
                      <>
                        {active.key === 'sales' && <AutomatedOutboundFlowChart />}
                        {active.key === 'marketing' && <SalesGtmFlowChart />}
                        {active.key === 'revops' && <AiRevOpsFlowChart />}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
            {!FLOW_CHART_KEYS.has(active.key) && (
              <>
                <div className={styles.modalMeta}>
                  {active.modal.meta.map(([k, v], i) => (
                    <span key={k}>
                      <span className={styles.k}>{k}</span>
                      <span className={styles.v}>{v}</span>
                      {i < active.modal.meta.length - 1 && <span className={styles.sep}> · </span>}
                    </span>
                  ))}
                </div>
                <div className={styles.modalActions}>
                  <a
                    ref={primaryBtnRef}
                    className={`${styles.modalBtn} ${styles.modalBtnPrimary}`}
                    href={active.modal.primary}
                  >
                    Open Live Demo <span aria-hidden="true">→</span>
                  </a>
                  <a
                    className={`${styles.modalBtn} ${styles.modalBtnSecondary}`}
                    href={active.modal.secondary}
                  >
                    Read the brief
                  </a>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
