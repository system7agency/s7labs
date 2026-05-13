import { StartBuildButton } from './StartBuildButton'

export function BuildHero() {
  return (
    <section className="hero">
      <div className="hero-grid">
        <div className="hero-copy">
          <div className="hero-eyebrow">
            <span className="accent-dot" />
            <span>
              S7_BUILDS <span className="v">{'//'}</span> SOFTWARE DEVELOPMENT
            </span>
          </div>
          <h1 className="hero-title">
            <span className="line l1" aria-label="Bespoke software,">
              <span className="typed" data-text="Bespoke software," />
              <span className="caret" aria-hidden="true" />
            </span>
            <span className="line l2">
              <span className="accent-text">built around the way your business works.</span>
            </span>
          </h1>
          <p className="hero-sub">
            We design and build client-facing products, internal platforms and AI-enabled tools that
            fit your business, your data and your operating model. From first idea to shipped
            system, System7 turns requirements into software people actually use.
          </p>
          <div className="cta-row">
            <StartBuildButton />
            <a className="btn ghost" href="#what-we-build">
              <span>See what we build</span>
            </a>
          </div>
          <div className="status-strip" id="statusStrip">
            <span className="dot" />
            <span className="step on" data-step="0">
              requirements.loaded
            </span>
            <span className="sep">·</span>
            <span className="step" data-step="1">
              interface.ready
            </span>
            <span className="sep">·</span>
            <span className="step" data-step="2">
              api.connected
            </span>
            <span className="sep">·</span>
            <span className="step" data-step="3">
              release.v1.shipped
            </span>
          </div>
        </div>

        <div className="console" aria-hidden="true">
          <div className="console-bg" />
          <div className="float-labels">
            <span>portal.ui</span>
            <span>admin.console</span>
            <span>data.model</span>
            <span>ai.module</span>
            <span>api.connected</span>
            <span>release.ready</span>
          </div>

          <div className="panel p-portal">
            <div className="pn-head">
              <span className="dots">
                <i />
                <i />
                <i />
              </span>
              <span className="title">portal.ui</span>
              <span className="badge">v1.4</span>
            </div>
            <div className="pn-portal-body">
              <div className="pn-portal-grid">
                <div className="pn-portal-nav">
                  <span className="item on">▸ Overview</span>
                  <span className="item">Requests</span>
                  <span className="item">Reports</span>
                  <span className="item">Settings</span>
                </div>
                <div className="pn-portal-main">
                  <div className="row acc" />
                  <div className="row" />
                  <div className="row" />
                  <div className="row" />
                  <div className="row" />
                </div>
              </div>
            </div>
          </div>

          <div className="panel p-admin">
            <div className="pn-head">
              <span className="dots">
                <i />
                <i />
                <i />
              </span>
              <span className="title">admin.console</span>
              <span className="badge">LIVE</span>
            </div>
            <div className="pn-body">
              <div className="pn-admin-grid">
                <div className="cell">
                  <div className="k">USERS</div>
                  <div className="v">1,284</div>
                </div>
                <div className="cell">
                  <div className="k">ACTIVE</div>
                  <div className="v acc">412</div>
                </div>
                <div className="cell">
                  <div className="k">QUEUE</div>
                  <div className="v">37</div>
                </div>
              </div>
              <div className="pn-admin-list">
                <div className="li">
                  <span>approval · #4821</span>
                  <span className="ok">✓ ok</span>
                </div>
                <div className="li">
                  <span>approval · #4822</span>
                  <span className="ok">✓ ok</span>
                </div>
              </div>
            </div>
          </div>

          <div className="panel p-ai">
            <div className="pn-head">
              <span className="dots">
                <i />
                <i />
                <i />
              </span>
              <span className="title">ai.module</span>
            </div>
            <div className="pn-ai-body">
              <span className="tag">AI · QUERY</span>
              <div className="q">› summarise q3 customer requests</div>
              <div className="a">
                Found <span className="v">86 requests</span> · 3 themes · 1 escalation
              </div>
            </div>
          </div>

          <div className="panel p-data">
            <div className="pn-head">
              <span className="dots">
                <i />
                <i />
                <i />
              </span>
              <span className="title">data.model</span>
              <span className="badge">SYNCED</span>
            </div>
            <div className="pn-data-body">
              <div className="pn-data-chart">
                <svg viewBox="0 0 240 60" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="bldDGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#4f8cff" stopOpacity="0.35" />
                      <stop offset="1" stopColor="#4f8cff" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0 46 L24 38 L48 42 L72 28 L96 34 L120 22 L144 28 L168 16 L192 22 L216 12 L240 18 L240 60 L0 60 Z"
                    fill="url(#bldDGrad)"
                  />
                  <path
                    d="M0 46 L24 38 L48 42 L72 28 L96 34 L120 22 L144 28 L168 16 L192 22 L216 12 L240 18"
                    stroke="#4f8cff"
                    strokeWidth="1.5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ filter: 'drop-shadow(0 0 4px rgba(79,140,255,.6))' }}
                  />
                </svg>
              </div>
              <div className="pn-data-meta">
                <span>RECORDS</span>
                <span className="v">12.4K</span>
              </div>
            </div>
          </div>

          <div className="panel p-api">
            <div className="pn-head">
              <span className="dots">
                <i />
                <i />
                <i />
              </span>
              <span className="title">api</span>
            </div>
            <div className="pn-api-body">
              <div className="row">
                <span className="dot" />
                <span className="name">hubspot.io</span>
                <span className="ms">28ms</span>
              </div>
              <div className="row">
                <span className="dot" />
                <span className="name">stripe.api</span>
                <span className="ms">41ms</span>
              </div>
              <div className="row">
                <span className="dot" />
                <span className="name">internal.db</span>
                <span className="ms">9ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
