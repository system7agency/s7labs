'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import { LabTitleHero } from '@/components/LabTitleHero'

import { APPS, type MiniApp } from '../_data/apps'
import { HowItWorksSection } from './HowItWorksSection'
import { InterestedModal } from './InterestedModal'
import { LearnMoreModal } from './LearnMoreModal'
import { MarketplaceToolbar, type SortKey } from './MarketplaceToolbar'
import { MiniAppCard } from './MiniAppCard'
import { MiniAppsHero } from './MiniAppsHero'
import { PageEyebrow } from './PageEyebrow'

type ModalState =
  | { kind: 'none' }
  | { kind: 'learn'; app: MiniApp }
  | { kind: 'interest'; app: MiniApp | null; intent: 'use' | 'similar' | 'customise' | 'different' }

const STATUS_ORDER: Record<MiniApp['status'], number> = {
  live: 0,
  'coming-soon': 1,
}

// Stable per-app number: position in the curated APPS array (oldest first).
// Shown as APP_XX on the card and used by the "Newest" sort, so an app keeps
// its number regardless of filtering or sorting.
const APP_NUMBER = new Map<string, number>(APPS.map((a, i) => [a.id, i]))

// Per the client's update the page leads straight into the live gallery
// ("Open, test, explore."). The intro "Test small products" hero, the "How it works"
// (01/03) section and the CTA (03/03) are hidden - kept in code (flip to true) to restore.
const SHOW_HIDDEN_SECTIONS = false

export function MiniAppsPageClient() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [size, setSize] = useState(4)
  const [sort, setSort] = useState<SortKey>('featured')
  const [modal, setModal] = useState<ModalState>({ kind: 'none' })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = APPS.filter((a) => {
      if (category !== 'all' && !a.cats.includes(category)) return false
      if (!q) return true
      const haystack = [a.name, a.short_description, a.category, ...a.tags].join(' ').toLowerCase()
      return haystack.includes(q)
    })
    if (sort === 'featured') {
      // Curated order (the APPS array), live apps ahead of coming-soon.
      list = [...list].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
    } else if (sort === 'newest') {
      list = [...list].sort((a, b) => (APP_NUMBER.get(b.id) ?? 0) - (APP_NUMBER.get(a.id) ?? 0))
    }
    return list
  }, [query, category, sort])

  const counts = useMemo(() => {
    const c = { live: 0, soon: 0 }
    for (const a of APPS) {
      if (a.status === 'live') c.live++
      else c.soon++
    }
    return c
  }, [])

  const handleLaunch = (app: MiniApp) => {
    if (!app.launch_url) return
    window.location.href = app.launch_url
  }

  const openInterested = (
    app: MiniApp | null,
    intent: 'use' | 'similar' | 'customise' | 'different' = 'use'
  ) => setModal({ kind: 'interest', app, intent })

  const gridClass = `grid grid-${size}`

  return (
    <>
      <PageEyebrow />
      <LabTitleHero
        eyebrow="ROUTE_04 · LIVE APPS"
        name="Live Apps"
        bgWord="LIVE APPS"
        subtitle="A marketplace of compact products you can open, test and learn from. Each one a focused tool that shows how useful software can solve a specific problem."
        meta={[
          { label: 'LIVE' },
          { label: 'SINGLE-JOB TOOLS' },
          { label: 'OPEN TO TEST', accent: true },
        ]}
        scrollHint="SCROLL"
      />
      {SHOW_HIDDEN_SECTIONS && <MiniAppsHero onSuggest={() => openInterested(null, 'different')} />}
      {SHOW_HIDDEN_SECTIONS && <HowItWorksSection />}

      <section className="sec sec-gallery" id="gallery">
        <div className="gallery-head reveal in">
          <div className="gh-eye">
            <span className="n">{'// 02 / 03'}</span> <span className="v">LIVE GALLERY</span>
          </div>
          <h2 className="gh-title">
            Open, <span className="accent-text">test, explore.</span>
          </h2>
        </div>

        <MarketplaceToolbar
          query={query}
          onQueryChange={setQuery}
          category={category}
          onCategoryChange={setCategory}
          size={size}
          onSizeChange={setSize}
          sort={sort}
          onSortChange={setSort}
        />

        <div className="result-meta">
          <span>{APPS.length} apps</span>
          <span className="dt">·</span>
          <span>
            <span className="v">{counts.live} live</span>
          </span>
          {counts.soon > 0 && (
            <>
              <span className="dt">·</span>
              <span className="dim">{counts.soon} coming soon</span>
            </>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="es-mark">∅</div>
            <div className="es-title">No apps match this filter</div>
            <div className="es-sub">Try a different category or clear the search.</div>
            <button
              type="button"
              className="ca-btn ca-ghost"
              onClick={() => {
                setQuery('')
                setCategory('all')
              }}
            >
              <span>Reset filters</span>
            </button>
          </div>
        ) : (
          <div className={gridClass}>
            {filtered.map((app) => (
              <MiniAppCard
                key={app.id}
                app={app}
                index={APP_NUMBER.get(app.id) ?? 0}
                onInterested={(a) => openInterested(a)}
                onLearnMore={(a) => setModal({ kind: 'learn', app: a })}
                onLaunch={handleLaunch}
              />
            ))}
          </div>
        )}
      </section>

      {SHOW_HIDDEN_SECTIONS && (
        <section className="sec" id="cta">
          <div className="cta-block reveal in">
            <span className="corner tl" />
            <span className="corner tr" />
            <span className="corner bl" />
            <span className="corner br" />

            <div className="cta-inner">
              <div className="eye">
                {'// 03 / 03 · '}
                <span className="v">BUILD IT</span>
              </div>
              <h2>
                Have an idea for a <span className="accent-text">live app?</span>
              </h2>
              <p className="sub">
                If you can describe the problem, System7 can turn it into a small product people can
                test. Start with a focused live app, then scale it into a fuller product, platform
                or agent-enabled system when the value is clear.
              </p>
              <div className="row">
                <button
                  type="button"
                  className="btn"
                  onClick={() => openInterested(null, 'different')}
                >
                  <span>Suggest an app</span>
                  <span className="arr" aria-hidden="true">
                    →
                  </span>
                </button>
                <Link href="/build" className="btn ghost">
                  <span>Start a build</span>
                </Link>
              </div>
              <div className="status-row">
                <span className="dot" />
                <span>
                  RESPONSE WITHIN <span className="v">24H</span>
                </span>
                <span className="sep" />
                <span>UK ENGINEERING</span>
                <span className="sep" />
                <span>UK TIMEZONE</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {modal.kind === 'learn' ? (
        <LearnMoreModal
          app={modal.app}
          onClose={() => setModal({ kind: 'none' })}
          onInterested={(app) => openInterested(app)}
          onLaunch={handleLaunch}
        />
      ) : null}
      {modal.kind === 'interest' ? (
        <InterestedModal
          app={modal.app}
          initialIntent={modal.intent}
          onClose={() => setModal({ kind: 'none' })}
        />
      ) : null}
    </>
  )
}
