import Link from 'next/link'

import './page-styles.css'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'

import { CapabilitiesSection } from './CapabilitiesSection'
import { PageScripts } from './PageScripts'
import { VoiceAgentCard } from './VoiceAgentCard'

export const metadata = {
  title: 'S7 Labs — RevOps Lab',
  description:
    "We're redefining revenue teams through systemisation, technology and AI/automation.",
}

export default function RevOpsLabPage() {
  return (
    <div className="revops-lab">
      <div className="bg-stack">
        <canvas id="aurora" />
        <div className="bg-dots" id="bgDots" />
      </div>
      <div className="bg-spotlight" id="spotlight" />
      <div className="bg-grain" id="bgGrain" />

      <Header />

      <main>
        <section className="hero">
          <div className="hero-eyebrow">
            <span className="accent-dot" />
            ROUTE_02 — REVOPS LAB
          </div>
          <div className="hero-title-wrap">
            <div className="osc-rings" aria-hidden="true">
              <div className="ring" />
              <div className="r2 ring" />
              <div className="r3 ring" />
            </div>
            <div className="hero-bg-word" aria-hidden="true">
              REVOPS
            </div>
            <h1 className="hero-title">
              <span className="accent-text">RevOps</span>
            </h1>
          </div>
          <p className="hero-subtitle">
            We&apos;re redefining revenue teams through systemisation, technology and AI/automation.
          </p>
          <div className="hero-meta">
            <span>SYSTEMS</span>
            <span className="sep" />
            <span>AGENTS</span>
            <span className="sep" />
            <span>AUTOMATION</span>
            <span className="sep" />
            <span className="v">BESPOKE</span>
          </div>
          <div className="scroll-hint">
            <span>SELECT APP</span>
            <span className="line" />
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <span className="section-eyebrow">
              <span className="accent-dot" />
              {'// LIVE APPS'}
            </span>
            <span className="section-num">
              03 / 06 · <span className="v">02 OF 03 LIVE</span>
            </span>
          </div>
          <div className="apps-connectors" aria-hidden="true">
            <span className="connector" />
            <span className="connector" />
            <span className="connector" />
          </div>
          <div className="apps-grid">
            <Link href="/revops/sales-insights" className="module">
              <span className="corner tl" />
              <span className="corner br" />
              <span className="mod-index" aria-hidden="true">
                01
              </span>
              <div>
                <h3 className="mod-name">Get Sales Insights</h3>
                <p className="mod-tagline">AI sales intelligence from your work email.</p>
              </div>
              <span className="mod-cta">
                <span>Enter</span>
                <span className="a">→</span>
              </span>
            </Link>

            <VoiceAgentCard />

            <div className="module soon" aria-disabled="true">
              <span className="corner tl" />
              <span className="corner br" />
              <span className="mod-index" aria-hidden="true">
                03
              </span>
              <div>
                <h3 className="mod-name">Coming Soon</h3>
                <p className="mod-tagline">New mini-apps shipped weekly. Bespoke per client.</p>
              </div>
              <span className="mod-cta">
                <span>Notify me</span>
              </span>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <span className="section-eyebrow">
              <span className="accent-dot" />
              {'// GOVERN AND UNLEASH AGENTS'}
            </span>
            <span className="section-num">04 / 06</span>
          </div>
          <div className="philosophy">
            <h2>We work bespoke. Per&nbsp;client. Per&nbsp;process.</h2>
            <p>
              We operate on a completely bespoke level per client — understanding your process, then
              mapping the system, the agents, and the automations around it.
            </p>
            <p>See a few examples of what&apos;s possible.</p>
            <div className="philosophy-bracket">
              <span className="b">[</span>
              <span>BELOW · 03 · CASE STUDIES</span>
              <span className="b">]</span>
            </div>
          </div>
        </section>

        <CapabilitiesSection />

        <section className="section">
          <div className="section-head">
            <span className="section-eyebrow">
              <span className="accent-dot" />
              {'// CASE STUDIES'}
            </span>
            <span className="section-num">05 / 06</span>
          </div>

          <div className="examples">
            <article className="example ex-1">
              <span className="br tl" />
              <span className="br tr" />
              <span className="br bl" />
              <span className="br br" />
              <div className="ex-eyebrow">
                {'// CLIENT RESEARCH · '}
                <span className="v">CASE 01</span>
              </div>
              <h3 className="ex-title">
                Client research in <span className="accent-text">15 minutes</span>.
              </h3>
              <div className="ex-1-grid">
                <div className="ex-1-left">
                  <div className="cmd-bar" aria-hidden="true">
                    <span className="prompt">/</span>
                    <span>research</span>
                    <span className="arg">[ company ]</span>
                    <span className="cursor" />
                  </div>
                  <div className="capability-grid">
                    <div className="cap">
                      <span className="status">done</span>
                      <span className="name">Company snapshot</span>
                    </div>
                    <div className="cap">
                      <span className="status">done</span>
                      <span className="name">Product positioning</span>
                    </div>
                    <div className="cap">
                      <span className="status">done</span>
                      <span className="name">Marketing analysis</span>
                    </div>
                    <div className="cap">
                      <span className="status">done</span>
                      <span className="name">Competitive context</span>
                    </div>
                    <div className="cap">
                      <span className="status">done</span>
                      <span className="name">Funnel review</span>
                    </div>
                    <div className="cap">
                      <span className="status">done</span>
                      <span className="name">Signal detection</span>
                    </div>
                  </div>
                  <div className="output-pill">5-MIN BRIEF</div>
                </div>
                <div className="ex-1-flow">
                  <div className="flow-row">
                    <span className="pill">INPUT</span>
                    <span className="arrow">→</span>
                    <span>company URL</span>
                  </div>
                  <div className="flow-counter">
                    <div className="big">06</div>
                    <div className="label">parallel agents</div>
                  </div>
                  <div className="flow-row">
                    <span className="pill live">OUTPUT</span>
                    <span className="arrow">→</span>
                    <span>5-min brief, ready</span>
                  </div>
                </div>
              </div>
              <div className="ex-tagline">
                15 minutes. <span className="v">Zero tab-switching.</span>
              </div>
            </article>

            <article className="example ex-2">
              <span className="br tl" />
              <span className="br tr" />
              <span className="br bl" />
              <span className="br br" />
              <div className="ex-eyebrow">
                {'// MORNING BRIEF · '}
                <span className="v">CASE 02</span>
              </div>
              <h3 className="ex-title">
                One morning. <span className="accent-text">Three&nbsp;builds.</span>
              </h3>
              <div className="ex-2-wrap">
                <div className="ex-2-intro">
                  <p className="app-tagline" style={{ maxWidth: '32ch' }}>
                    Brief three agents at 9am. Walk away. Review at noon. The waiting is gone.
                  </p>
                  <div className="vs-old" style={{ marginTop: 24 }}>
                    <div>
                      <span className="strike">old workflow · 2 days · sequential</span>
                    </div>
                    <div>
                      <span className="now">new · 3 hours · parallel</span>
                    </div>
                  </div>
                </div>
                <div className="timeline">
                  <div className="tl-row active">
                    <span className="tl-time">9:00</span>
                    <div className="tl-label">
                      {'// '}
                      <span className="v">brief 3 agents</span>
                    </div>
                    <div className="agent-list">
                      <div className="agent" style={{ ['--c' as string]: 'var(--c-orange)' }}>
                        <span className="swatch" />
                        <span className="name">reporting_dashboard.agent</span>
                        <span className="meta">briefed</span>
                      </div>
                      <div className="agent" style={{ ['--c' as string]: 'var(--c-blue)' }}>
                        <span className="swatch" />
                        <span className="name">slide_deck_outline.agent</span>
                        <span className="meta">briefed</span>
                      </div>
                      <div className="agent" style={{ ['--c' as string]: 'var(--c-purple)' }}>
                        <span className="swatch" />
                        <span className="name">lead_scoring.agent</span>
                        <span className="meta">briefed</span>
                      </div>
                    </div>
                  </div>
                  <div className="tl-row">
                    <span className="tl-time">9:15</span>
                    <div className="tl-label">{'// agents run in parallel'}</div>
                    <div className="parallel-bars">
                      <div
                        className="pbar"
                        style={{
                          ['--c' as string]: 'var(--c-orange)',
                          ['--w' as string]: '78%',
                        }}
                      >
                        <span className="lbl">reporting</span>
                      </div>
                      <div
                        className="pbar"
                        style={{
                          ['--c' as string]: 'var(--c-blue)',
                          ['--w' as string]: '64%',
                        }}
                      >
                        <span className="lbl">slide deck</span>
                      </div>
                      <div
                        className="pbar"
                        style={{
                          ['--c' as string]: 'var(--c-purple)',
                          ['--w' as string]: '92%',
                        }}
                      >
                        <span className="lbl">lead scoring</span>
                      </div>
                    </div>
                  </div>
                  <div className="tl-row">
                    <span className="tl-time">9:45</span>
                    <div className="tl-label">{'// review all outputs'}</div>
                  </div>
                  <div className="tl-row">
                    <span className="tl-time">12:00</span>
                    <div className="tl-label">
                      {'// '}
                      <span className="v">done</span>
                    </div>
                    <div className="delivered-row">
                      <span className="item">
                        <span className="check">✓</span> dashboard shipped
                      </span>
                      <span className="item">
                        <span className="check">✓</span> deck shipped
                      </span>
                      <span className="item">
                        <span className="check">✓</span> scoring live
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="ex-tagline">
                The waiting is <span className="v">gone.</span>
              </div>
            </article>

            <article className="example ex-3">
              <span className="br tl" />
              <span className="br tr" />
              <span className="br bl" />
              <span className="br br" />
              <div className="ex-eyebrow">
                {'// HOW IT WORKS · '}
                <span className="v">CASE 03</span>
              </div>
              <h3 className="ex-title">
                GTM lead-gen <span className="accent-text">pipeline.</span>
              </h3>
              <div className="ex-3-wrap">
                <div className="code-card" aria-hidden="true">
                  <div className="code-card-head">
                    <span className="dot green" />
                    <span className="dot" />
                    <span className="dot" />
                    <span className="label">gtm-lead-gen-pipeline</span>
                    <span className="ver">v2.4.1</span>
                  </div>
                  <div className="code-body">
                    <div className="row init">
                      <span className="step">init</span>
                      <span className="arrow">→</span>
                      <span className="fn">gtm-lead-gen-pipeline v2.4.1</span>
                    </div>
                    <div className="row">
                      <span className="step">step 1</span>
                      <span className="arrow">→</span>
                      <span className="fn">
                        <span className="ns">clay</span>.enrich()
                      </span>
                      <span className="out">
                        <span className="v">2,847</span> leads sourced
                      </span>
                    </div>
                    <div className="row">
                      <span className="step">step 2</span>
                      <span className="arrow">→</span>
                      <span className="fn">
                        <span className="ns">octave</span>.research(icp)
                      </span>
                      <span className="out">
                        copy agents <span className="v">deployed</span>
                      </span>
                    </div>
                    <div className="row">
                      <span className="step">step 3</span>
                      <span className="arrow">→</span>
                      <span className="fn">
                        <span className="ns">signaliz</span>.signals()
                      </span>
                      <span className="out">
                        <span className="v">1,204</span> intent matches
                      </span>
                    </div>
                    <div className="row">
                      <span className="step">step 4</span>
                      <span className="arrow">→</span>
                      <span className="fn">
                        <span className="ns">maildoso</span>.verify()
                      </span>
                      <span className="out">
                        <span className="v">98.7%</span> deliverability
                      </span>
                    </div>
                    <div className="row">
                      <span className="step">step 5</span>
                      <span className="arrow">→</span>
                      <span className="fn">
                        <span className="ns">instantly</span>.launch()
                      </span>
                      <span className="out">
                        <span className="v">3</span> sequences active
                      </span>
                    </div>
                    <div className="row">
                      <span className="step">step 6</span>
                      <span className="arrow">→</span>
                      <span className="fn">
                        <span className="ns">heyreach</span>.connect()
                      </span>
                      <span className="out">
                        LinkedIn outreach <span className="v">live</span>
                      </span>
                    </div>
                    <div className="row">
                      <span className="step">step 7</span>
                      <span className="arrow">→</span>
                      <span className="fn">
                        <span className="ns">outbound-sync</span>.sync()
                      </span>
                      <span className="out">
                        HubSpot <span className="v">updated</span>
                      </span>
                    </div>
                    <div className="row">
                      <span className="step">step 8</span>
                      <span className="arrow">→</span>
                      <span className="fn">
                        <span className="ns">hubspot</span>.track()
                      </span>
                      <span className="out">
                        opportunities <span className="v">enriched</span>
                      </span>
                    </div>
                    <div className="row result">
                      <span className="step">result</span>
                      <span className="arrow">→</span>
                      <span className="fn">
                        pipeline ready — all systems operational <span className="check">✓</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="stack">
                  <div className="tool">
                    <span className="icn">CL</span>
                    <span className="nm">
                      Clay<span className="role">enrichment</span>
                    </span>
                  </div>
                  <div className="tool">
                    <span className="icn">OC</span>
                    <span className="nm">
                      Octave<span className="role">copy agents</span>
                    </span>
                  </div>
                  <div className="tool">
                    <span className="icn">SI</span>
                    <span className="nm">
                      Signaliz<span className="role">intent signals</span>
                    </span>
                  </div>
                  <div className="tool">
                    <span className="icn">MD</span>
                    <span className="nm">
                      Maildoso<span className="role">deliverability</span>
                    </span>
                  </div>
                  <div className="tool">
                    <span className="icn">IN</span>
                    <span className="nm">
                      Instantly<span className="role">email seq.</span>
                    </span>
                  </div>
                  <div className="tool">
                    <span className="icn">HR</span>
                    <span className="nm">
                      Heyreach<span className="role">linkedin</span>
                    </span>
                  </div>
                  <div className="tool">
                    <span className="icn">OS</span>
                    <span className="nm">
                      Outbound Sync<span className="role">crm bridge</span>
                    </span>
                  </div>
                  <div className="tool">
                    <span className="icn">HS</span>
                    <span className="nm">
                      HubSpot<span className="role">crm</span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="ex-tagline">
                8 tools. <span className="v">1 pipeline.</span> 0 manual handoffs.
              </div>
            </article>
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <span className="section-eyebrow">
              <span className="accent-dot" />
              {'// OPERATIONAL'}
            </span>
            <span className="section-num">06 / 06</span>
          </div>
          <div className="closer">
            <div className="accent-dot-row" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <h2>
              Your company always in&nbsp;<span className="accent-text">sync</span>, handled and
              automated.
            </h2>
            <div className="subline">SYSTEM7 · REVOPS LAB · LIVE</div>
          </div>
        </section>
      </main>

      <Footer />

      <PageScripts />
    </div>
  )
}
