import './(marketing)/landing/page-styles.css'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'

import { PageScripts } from './(marketing)/landing/PageScripts'

export default function HomePage() {
  return (
    <>
      <div className="bg-stack">
        <canvas id="aurora" />
        <div className="bg-dots" id="bgDots" />
      </div>
      <div className="bg-spotlight" id="spotlight" />
      <div className="bg-grain" id="bgGrain" />

      <Header />

      <main>
        <section className="hero">
          <div className="hero-orbits" id="orbits" />
          <div className="hero-eyebrow">Innovation Lab · est. 2025</div>
          <div className="hero-title-wrap" id="titleWrap">
            <div className="osc-rings" aria-hidden="true">
              <div className="ring" />
              <div className="r2 ring" />
              <div className="r3 ring" />
            </div>
            <div className="hero-bg-word" aria-hidden="true">
              LABS
            </div>
            <h1 className="hero-title">
              <span className="word s7">
                S<sup className="hero-s7-sup">7</sup>
              </span>
              <span className="beam" aria-hidden="true">
                <span className="beam-readout top">— λ</span>
                <span className="beam-readout bot">00·05</span>
                <span className="beam-ticks">
                  <span className="l" />
                  <span className="l" />
                  <span className="l" />
                  <span className="l" />
                  <span className="l" />
                  <span className="r" />
                  <span className="r" />
                  <span className="r" />
                  <span className="r" />
                  <span className="r" />
                </span>
              </span>
              <span className="word labs">Labs</span>
            </h1>
          </div>
          <p className="hero-subtitle" id="heroSub" />
          <div className="scroll-hint">
            <span>SELECT ROUTE</span>
            <span className="line" />
          </div>
        </section>

        <section className="routes-section">
          <div className="routes-header">
            <span className="routes-label">{'// Active Routes'}</span>
            <span className="routes-count">05 / 05</span>
          </div>

          <div className="routes-grid">
            <a
              href="/revops"
              className="route-card tiltable"
              data-route="revops"
              data-label="revops_s7labs"
            >
              <span className="scan-line" />
              <div className="card-glyphs" aria-hidden="true">
                <span style={{ top: '12%', right: '18%' }}>{'// pipeline'}</span>
                <span style={{ top: '72%', right: '12%' }}>Σ revenue</span>
                <span style={{ top: '42%', left: '10%' }}>⌁</span>
              </div>
              <div className="route-card-inner">
                <span className="route-index">ROUTE_01</span>
                <div className="route-label">
                  <span className="prompt">$</span>
                  <span className="typed" />
                  <span className="type-cursor" />
                </div>
                <p className="route-tagline">
                  AI-native pipeline, qualification, and outbound orchestration.
                </p>
                <div className="route-meta">
                  <span className="route-tag">SALES · REVOPS · PIPELINE</span>
                  <span className="route-arrow">
                    <span>ENTER</span>
                    <span className="a">→</span>
                  </span>
                </div>
              </div>
            </a>

            <a
              href="/creator"
              className="route-card tiltable"
              data-route="creator"
              data-label="creator_s7labs"
            >
              <span className="scan-line" />
              <div className="card-glyphs" aria-hidden="true">
                <span style={{ top: '12%', right: '18%' }}>01010110</span>
                <span style={{ top: '72%', right: '10%' }}>→ init</span>
                <span style={{ top: '42%', left: '10%' }}>λ</span>
              </div>
              <div className="route-card-inner">
                <span className="route-index">ROUTE_02</span>
                <div className="route-label">
                  <span className="prompt">$</span>
                  <span className="typed" />
                  <span className="type-cursor" />
                </div>
                <p className="route-tagline">
                  Software applications for content creators to launch to their audience.
                </p>
                <div className="route-meta">
                  <span className="route-tag">SOFTWARE · DEVELOPMENT · CONTENT</span>
                  <span className="route-arrow">
                    <span>ENTER</span>
                    <span className="a">→</span>
                  </span>
                </div>
              </div>
            </a>

            <a
              href="/build"
              className="route-card tiltable"
              data-route="build"
              data-label="build_s7labs"
            >
              <span className="scan-line" />
              <div className="card-glyphs" aria-hidden="true">
                <span style={{ top: '12%', right: '18%' }}>{'// systems'}</span>
                <span style={{ top: '72%', right: '12%' }}>∆ build</span>
                <span style={{ top: '42%', left: '10%' }}>◇</span>
              </div>
              <div className="route-card-inner">
                <span className="route-index">ROUTE_03</span>
                <div className="route-label">
                  <span className="prompt">$</span>
                  <span className="typed" />
                  <span className="type-cursor" />
                </div>
                <p className="route-tagline">
                  Custom AI systems for teams defining the future of their industry.
                </p>
                <div className="route-meta">
                  <span className="route-tag">AI · SYSTEMS · CUSTOM</span>
                  <span className="route-arrow">
                    <span>ENTER</span>
                    <span className="a">→</span>
                  </span>
                </div>
              </div>
            </a>

            <a
              href="/agent"
              className="route-card tiltable"
              data-route="agent"
              data-label="agent_s7labs"
            >
              <span className="scan-line" />
              <div className="card-glyphs" aria-hidden="true">
                <span style={{ top: '12%', right: '18%' }}>{'// agent'}</span>
                <span style={{ top: '72%', right: '10%' }}>→ talk</span>
                <span style={{ top: '42%', left: '10%' }}>◉</span>
              </div>
              <div className="route-card-inner">
                <span className="route-index">ROUTE_04</span>
                <div className="route-label">
                  <span className="prompt">$</span>
                  <span className="typed" />
                  <span className="type-cursor" />
                </div>
                <p className="route-tagline">
                  Voice and chat agents for sales, support, and intake.
                </p>
                <div className="route-meta">
                  <span className="route-tag">SOFTWARE · VOICE · CHAT</span>
                  <span className="route-arrow">
                    <span>ENTER</span>
                    <span className="a">→</span>
                  </span>
                </div>
              </div>
            </a>
          </div>

          <div className="soon-row">
            <a
              href="/mini-apps"
              className="route-card tiltable"
              data-route="mini-apps"
              data-label="miniApps_s7labs"
            >
              <span className="scan-line" />
              <div className="card-glyphs" aria-hidden="true">
                <span style={{ top: '12%', right: '18%' }}>{'// gallery'}</span>
                <span style={{ top: '72%', right: '10%' }}>★ demo</span>
                <span style={{ top: '42%', left: '10%' }}>▣</span>
              </div>
              <div className="route-card-inner">
                <span className="route-index">ROUTE_05</span>
                <div className="route-label">
                  <span className="prompt">$</span>
                  <span className="typed" />
                  <span className="type-cursor" />
                </div>
                <p className="route-tagline">
                  Small AI utilities and live experiments — a gallery of what&apos;s possible.
                </p>
                <div className="route-meta">
                  <span className="route-tag">GALLERY · DEMOS · UTILITIES</span>
                  <span className="route-arrow">
                    <span>ENTER</span>
                    <span className="a">→</span>
                  </span>
                </div>
              </div>
            </a>
          </div>
        </section>
      </main>

      <Footer />

      <PageScripts />
    </>
  )
}
