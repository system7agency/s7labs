'use client'

import { useEffect, useState } from 'react'

const CYCLE = ['app.loaded', 'preview.ready', 'demo.live', 'try.now']

type MiniAppsHeroProps = {
  onSuggest: () => void
}

export function MiniAppsHero({ onSuggest }: MiniAppsHeroProps) {
  const [cycle, setCycle] = useState(0)
  const [focusIdx, setFocusIdx] = useState(4)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    const cId = setInterval(() => setCycle((c) => (c + 1) % CYCLE.length), 2200)
    const fId = setInterval(() => setFocusIdx((i) => (i + 1) % 5), 4200)
    return () => {
      clearInterval(cId)
      clearInterval(fId)
    }
  }, [])

  const focusClass = (i: number) => (i === focusIdx ? ' sc-focus' : '')

  return (
    <section className="hero">
      <div className="hero-grid">
        <div className="hero-copy">
          <div className="hero-eyebrow">
            <span className="accent-dot" />
            <span>
              S7_MINI-APPS <span className="v">{'//'}</span> LIVE SOFTWARE PRODUCTS
            </span>
          </div>

          <h1 className="hero-title">
            <span className="line l1" aria-label="Test small software products">
              <span className="typed" data-text="Test small software products" />
              <span className="caret" aria-hidden="true" />
            </span>
            <span className="line l2">
              <span className="accent-text">before you build big ones.</span>
            </span>
          </h1>

          <p className="hero-sub">
            Explore live mini-apps built by System7. Each one is a compact product you can open,
            test and learn from — showing how useful software can solve specific problems, connect
            ideas and turn capability into something tangible.
          </p>

          <div className="cta-row">
            <a href="#gallery" className="btn">
              <span>Explore mini-apps</span>
              <span className="arr" aria-hidden="true">
                →
              </span>
            </a>
            <button type="button" className="btn ghost" onClick={onSuggest}>
              <span>Suggest an app</span>
            </button>
          </div>

          <div className="hero-status">
            <span className="livedot" />
            <span className="cycler">{CYCLE[cycle]}</span>
          </div>
        </div>

        <div className="shelf" aria-hidden="true">
          <div className="shelf-floats">
            <span className="sf sf-1">
              <i />
              live.demo
            </span>
            <span className="sf sf-2">
              <i />
              app.ready
            </span>
            <span className="sf sf-3">
              <i />
              try.now
            </span>
            <span className="sf sf-4">
              <i />
              mini.product
            </span>
            <span className="sf sf-5">
              <i />
              built.by.s7
            </span>
            <span className="sf sf-6">
              <i />
              launchable
            </span>
          </div>

          <div className="shelf-stage">
            <div className={`sc sc-l3 sc-1${focusClass(0)}`}>
              <div className="sc-chip live">
                <i />
                LIVE
              </div>
              <div className="sc-thumb sc-thumb-chart">
                <i style={{ ['--w' as string]: '30%' }} />
                <i style={{ ['--w' as string]: '55%' }} />
                <i style={{ ['--w' as string]: '42%' }} />
                <i style={{ ['--w' as string]: '74%' }} />
                <i style={{ ['--w' as string]: '60%' }} />
              </div>
              <div className="sc-name">VSignal</div>
            </div>
            <div className={`sc sc-l3 sc-2${focusClass(1)}`}>
              <div className="sc-chip beta">
                <i />
                BETA
              </div>
              <div className="sc-thumb sc-thumb-rows">
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className="sc-name">CSV Cleanup</div>
            </div>

            <div className={`sc sc-l2 sc-3${focusClass(2)}`}>
              <div className="sc-chip new">
                <i />
                NEW
              </div>
              <div className="sc-thumb sc-thumb-grid">
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className="sc-name">Decision Matrix</div>
            </div>
            <div className={`sc sc-l2 sc-4${focusClass(3)}`}>
              <div className="sc-chip beta">
                <i />
                BETA
              </div>
              <div className="sc-thumb sc-thumb-doc">
                <span className="ln" />
                <span className="ln hi" />
                <span className="ln" />
                <span className="ln hi" />
                <span className="ln" />
              </div>
              <div className="sc-name">Doc Intelligence</div>
            </div>

            <div className={`sc sc-l1 sc-5${focusClass(4)}`}>
              <div className="sc-chip live">
                <i />
                LIVE
              </div>
              <div className="sc-thumb sc-thumb-chat">
                <span className="bb bb-l">
                  <i />
                  <i style={{ width: '60%' }} />
                </span>
                <span className="bb bb-r">
                  <i style={{ width: '80%' }} />
                  <i style={{ width: '40%' }} />
                </span>
                <span className="bb bb-l bb-cal">
                  <i className="cal" />
                </span>
              </div>
              <div className="sc-name">Meet-Ting</div>
              <div className="sc-meta">ai · scheduling · email · whatsapp</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
