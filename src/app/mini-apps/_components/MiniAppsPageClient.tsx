'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

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
  new: 1,
  beta: 2,
  prototype: 3,
  'coming-soon': 4,
}

export function MiniAppsPageClient() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [size, setSize] = useState(5)
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
      list = [...list].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
    } else if (sort === 'newest') {
      list = [...list].sort((a, b) => {
        const av = a.status === 'new' ? 0 : a.status === 'beta' ? 1 : 2
        const bv = b.status === 'new' ? 0 : b.status === 'beta' ? 1 : 2
        return av - bv
      })
    } else if (sort === 'most-used') {
      list = [...list].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
    } else if (sort === 'quickest') {
      list = [...list].sort((a, b) => {
        const av = a.launch_url ? 0 : 1
        const bv = b.launch_url ? 0 : 1
        return av - bv
      })
    }
    return list
  }, [query, category, sort])

  const counts = useMemo(() => {
    const c = { live: 0, beta: 0, new: 0, prototype: 0, soon: 0 }
    for (const a of APPS) {
      if (a.status === 'live') c.live++
      else if (a.status === 'beta') c.beta++
      else if (a.status === 'new') c.new++
      else if (a.status === 'prototype') c.prototype++
      else c.soon++
    }
    return c
  }, [])

  const handleLaunch = (app: MiniApp) => {
    if (!app.launch_url) return
    window.open(app.launch_url, '_blank', 'noopener,noreferrer')
  }

  const openInterested = (
    app: MiniApp | null,
    intent: 'use' | 'similar' | 'customise' | 'different' = 'use'
  ) => setModal({ kind: 'interest', app, intent })

  const gridClass = `grid grid-${size}`

  return (
    <>
      <PageEyebrow />
      <MiniAppsHero onSuggest={() => openInterested(null, 'different')} />
      <HowItWorksSection />

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
          <span className="dt">·</span>
          <span>
            <span className="amb">{counts.beta} beta</span>
          </span>
          <span className="dt">·</span>
          <span>
            <span className="vv">{counts.new} new</span>
          </span>
          <span className="dt">·</span>
          <span>{counts.prototype} prototype</span>
          <span className="dt">·</span>
          <span className="dim">{counts.soon} coming soon</span>
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
          (() => {
            const filtersActive = category !== 'all' || query.trim() !== ''
            const cardProps = (a: MiniApp) => ({
              app: a,
              onInterested: (x: MiniApp) => openInterested(x),
              onLearnMore: (x: MiniApp) => setModal({ kind: 'learn', app: x }),
              onLaunch: handleLaunch,
            })

            if (filtersActive) {
              return (
                <div className={gridClass}>
                  {filtered.map((app) => (
                    <MiniAppCard key={app.id} {...cardProps(app)} />
                  ))}
                </div>
              )
            }

            const liveBand = filtered.filter((a) => a.status === 'live')
            const newBand = filtered.filter((a) => a.status === 'new' || a.status === 'beta')
            const labBand = filtered.filter(
              (a) => a.status === 'prototype' || a.status === 'coming-soon'
            )

            return (
              <>
                {liveBand.length > 0 ? (
                  <div className="band band-live">
                    <div className="band-head">
                      <div className="band-eye">
                        <span className="band-dot" />
                        LIVE NOW
                      </div>
                      <div className="band-meta">
                        <span className="v">{liveBand.length} shipped</span>
                        <span className="dt">·</span>
                        <span>open and use directly</span>
                      </div>
                    </div>
                    <div className="grid-2 grid">
                      {liveBand.map((app) => (
                        <MiniAppCard key={app.id} {...cardProps(app)} />
                      ))}
                    </div>
                  </div>
                ) : null}

                {newBand.length > 0 ? (
                  <div className="band band-new">
                    <div className="band-head">
                      <div className="band-eye">
                        <span className="band-dot amb" />
                        IN BETA / NEW
                      </div>
                      <div className="band-meta">
                        <span className="amb">{newBand.length} testing</span>
                        <span className="dt">·</span>
                        <span>usable previews</span>
                      </div>
                    </div>
                    <div className="grid-3 grid">
                      {newBand.map((app) => (
                        <MiniAppCard key={app.id} {...cardProps(app)} />
                      ))}
                    </div>
                  </div>
                ) : null}

                {labBand.length > 0 ? (
                  <div className="band band-lab">
                    <div className="band-head">
                      <div className="band-eye">
                        <span className="band-dot dim" />
                        IN THE LAB
                      </div>
                      <div className="band-meta">
                        <span className="dim">{labBand.length} in development</span>
                        <span className="dt">·</span>
                        <span>register interest to shape them</span>
                      </div>
                    </div>
                    <div className="grid-4 grid">
                      {labBand.map((app) => (
                        <MiniAppCard key={app.id} {...cardProps(app)} />
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            )
          })()
        )}
      </section>

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
              Have an idea for a <span className="accent-text">mini-app?</span>
            </h2>
            <p className="sub">
              If you can describe the problem, System7 can turn it into a small product people can
              test. Start with a focused mini-app, then scale it into a fuller product, platform or
              agent-enabled system when the value is clear.
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
