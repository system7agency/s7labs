'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'

import styles from './CapabilitiesSection.module.css'

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
    index: '01',
    eyebrow: 'OUTBOUND → INBOUND',
    title: 'Sales / GTM',
    desc: 'Our systems improve GTM efficiency from outbound to inbound and throughout the sales funnel. We recommend top tools, create a unified system, and implement them for an optimized GTM tech stack.',
    meta: 'SALES · GTM',
    backTag: '// 01 CAPABILITIES',
    list: [
      'Automated GTM co-pilots',
      'TAM mapping & deep enrichment',
      'Automated, personalized outbound',
      'Lead qualification and normalization',
      'Mid-funnel automation',
      'Custom sales / GTM requests',
      'Competitive intelligence',
      'AI research automation',
      'Meeting prep automation',
      'Email deliverability optimization',
      'Automated LinkedIn outreach',
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
      eyebrow: 'CAPABILITY · 01 / SALES & GTM',
      title: 'Outbound that compounds',
      sub: 'Connect every signal — intent, fit, behaviour — to a sequenced motion that reaches the right account at the right moment, without the manual reps in between.',
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
    index: '02',
    eyebrow: 'DATA → INSIGHT',
    title: 'Marketing / Growth',
    desc: 'We transform your marketing data into valuable insights and streamline your growth data for automated next steps. Our approach converts your ads, webinars, conferences, and emails into impactful sales data.',
    meta: 'MARKETING · GROWTH',
    backTag: '// 02 CAPABILITIES',
    list: [
      'Inbound lead enrichment',
      'Account scoring and assignment',
      'Inbound-led outbound sequences',
      'Paid ads audience building',
      'Custom landing pages at scale',
      'Deep ICP / account enrichment and research',
      'Custom marketing / growth requests',
      'Event marketing outreach automation',
      'Social tracking & competitive monitoring',
      'Website visitor tracking',
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
      eyebrow: 'CAPABILITY · 02 / MARKETING & GROWTH',
      title: 'Demand, not noise',
      sub: 'Programmatic content engines, attribution that survives ad-blockers, and visitor-level intelligence — wired into the same pipeline that closes revenue.',
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
    index: '03',
    eyebrow: 'CRM → ECOSYSTEM',
    title: 'RevOps',
    desc: 'We help businesses transform their CRMs into thriving ecosystems. In the age of AI, strong CRMs are essential for success. We ensure your data is accurate and ready for automation to improve operations.',
    meta: 'REVOPS · CRM',
    backTag: '// 03 CAPABILITIES',
    list: [
      'CRM data cleaning',
      'Automated CRM enrichment',
      'Data normalization',
      'Account, contact, and lead research',
      'Automated campaign updates',
      'CRM lead scoring',
      'Custom RevOps requests',
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
      eyebrow: 'CAPABILITY · 03 / REVOPS',
      title: 'The system underneath the system',
      sub: 'CRM, dashboards, lead routing, custom requests — re-engineered as a single instrument panel that operators can actually steer.',
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

export function CapabilitiesSection() {
  const [activeKey, setActiveKey] = useState<Capability['key'] | null>(null)
  const lastFocusRef = useRef<HTMLElement | null>(null)
  const primaryBtnRef = useRef<HTMLAnchorElement | null>(null)
  const active = activeKey ? (CAPABILITIES.find((c) => c.key === activeKey) ?? null) : null

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
        {CAPABILITIES.map((cap) => (
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
          <div className={styles.modal} role="document">
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
            <h3>{active.modal.title}</h3>
            <p className={styles.modalSub}>{active.modal.sub}</p>
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
          </div>
        )}
      </div>
    </section>
  )
}
