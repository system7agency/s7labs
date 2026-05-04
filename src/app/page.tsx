import './(marketing)/landing/page-styles.css'

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

      <header>
        <div className="header-left">
          <a href="#" className="back-link" aria-label="Back to System7">
            <span className="arr">←</span>
            <span className="full">Back to system7</span>
          </a>
        </div>
        <div className="wordmark">
          <span className="dot" />
          S7 LABS
        </div>
        <div className="header-right">
          <a
            href="https://www.linkedin.com/company/system7agency/"
            className="li-btn"
            aria-label="LinkedIn"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.14 8h4.72V23H.14V8zm7.58 0h4.52v2.05h.06c.63-1.2 2.17-2.46 4.47-2.46 4.78 0 5.66 3.14 5.66 7.22V23h-4.71v-6.67c0-1.59-.03-3.64-2.22-3.64-2.22 0-2.56 1.74-2.56 3.52V23H7.72V8z" />
            </svg>
            <span className="li-label">LinkedIn</span>
          </a>
          <a href="#phone" className="phone-pill" aria-label="Call AI System 7 — voice agent">
            <span className="live-dot" />
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span className="label">AI System 7</span>
          </a>
        </div>
      </header>

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
              <span className="word s7">S7</span>
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
            <span className="routes-count">02 / 03</span>
          </div>

          <div className="routes-grid">
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
                <span className="route-index">ROUTE_01</span>
                <div className="route-label">
                  <span className="prompt">$</span>
                  <span className="typed" />
                  <span className="type-cursor" />
                </div>
                <p className="route-tagline">
                  Content engines and brand intelligence for creative teams.
                </p>
                <div className="route-meta">
                  <span className="route-tag">CREATIVE · BRAND · CONTENT</span>
                  <span className="route-arrow">
                    <span>ENTER</span>
                    <span className="a">→</span>
                  </span>
                </div>
              </div>
            </a>

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
                <span className="route-index">ROUTE_02</span>
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
          </div>

          <div className="soon-row">
            <a className="route-card soon" aria-disabled="true">
              <div className="route-card-inner">
                <span className="route-index">ROUTE_03</span>
                <div className="route-label">
                  <span className="prompt">$</span>build_s7labs
                </div>
                <p className="route-tagline">
                  Custom AI systems for teams defining the future of their industry.
                </p>
                <div className="route-meta">
                  <span className="soon-badge">COMING SOON</span>
                  <span className="route-arrow">
                    <span>—</span>
                  </span>
                </div>
              </div>
            </a>
          </div>
        </section>
      </main>

      <footer>
        <div className="foot-left">
          <span>S7 LABS</span>
          <span style={{ color: 'var(--fg-dim)' }}>·</span>
          <span>A SYSTEM7 VENTURE</span>
        </div>
        <div className="foot-right">
          <span>v0.2.0</span>
          <span style={{ color: 'var(--fg-dim)' }}>·</span>
          <span>© 2025</span>
        </div>
      </footer>

      <PageScripts />
    </>
  )
}
