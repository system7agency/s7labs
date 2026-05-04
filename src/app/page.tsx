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
          <a
            className="back-link"
            href="https://www.system7.ai/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Back to System7"
          >
            <span className="back-link-arrow" aria-hidden="true">
              ←
            </span>
            <span className="back-link-logo" aria-hidden="true">
              <svg
                width="101"
                height="24"
                viewBox="0 0 101 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M85.1397 3.74561C87.6735 3.74561 89.9318 5.12262 89.9318 9.474V18.5072H86.4066V10.0248C86.4066 7.82158 85.7732 6.94028 84.0657 6.94028C82.5234 6.94028 81.3392 8.59271 81.3392 11.1815V18.5072H77.814V10.3553C77.814 8.15206 77.5111 6.94028 75.721 6.94028C74.0135 6.94028 72.7466 8.97827 72.7466 11.7874V18.5072H69.2214V3.96593H72.7466V4.79214C72.7466 5.50819 72.5538 5.92129 72.2784 6.52718C72.1683 6.77504 72.0856 7.05045 72.361 7.13307C72.6364 7.21569 72.7466 6.96782 72.8017 6.83012C73.5453 4.92984 74.8947 3.74561 76.8226 3.74561C78.7229 3.74561 79.9346 4.92984 80.3202 6.6098C80.3753 6.80258 80.513 6.8852 80.7333 6.8852C80.8985 6.8852 81.0362 6.83012 81.1189 6.63734C81.9451 4.79214 83.4047 3.74561 85.1397 3.74561Z"
                  fill="currentColor"
                />
                <path
                  d="M67.4605 11.0438C67.4605 11.4294 67.433 11.7048 67.3779 12.1179H56.8024C57.0503 14.3211 58.4824 15.643 60.6856 15.643C62.3656 15.643 63.2193 14.7342 63.6324 13.4398H67.2127C66.5792 16.4417 64.5412 18.7276 60.6581 18.7276C55.9487 18.7276 53.3599 15.5604 53.3599 11.2366C53.3599 6.69242 56.169 3.74561 60.603 3.74561C63.9629 3.74561 67.4605 5.75605 67.4605 11.0438ZM56.9401 9.69432H63.9354C63.7977 7.93174 62.7511 6.6098 60.7131 6.6098C58.3171 6.6098 57.2981 7.95928 56.9401 9.69432Z"
                  fill="currentColor"
                />
                <path
                  d="M52.2686 3.96581V7.05033H48.3028V13.6876C48.3028 15.2849 48.3304 15.4226 49.8175 15.4226H52.2686V18.5071H49.074C46.1547 18.5071 44.7777 17.5432 44.7777 14.0456V7.05033H42.1338V3.96581H44.7777V0H48.3028V3.96581H52.2686Z"
                  fill="currentColor"
                />
                <path
                  d="M28.2405 13.605H31.7106C31.7381 14.6791 32.3715 15.9735 34.9328 15.9735C37.1911 15.9735 37.9347 15.2024 37.9347 14.2385C37.9347 13.1644 36.5026 12.9992 33.721 12.6687C29.2595 12.1179 28.6811 9.80448 28.6811 8.1796C28.6811 5.81113 30.7742 3.74561 34.9052 3.74561C38.7333 3.74561 40.8264 5.78359 41.0192 8.42746H37.5491C37.4665 7.51863 36.8606 6.49964 34.8226 6.49964C32.8122 6.49964 32.2063 7.16061 32.2063 7.98682C32.2063 8.67533 32.5092 9.25367 35.3459 9.52908C38.8986 9.8871 41.4598 11.0438 41.4598 13.9631C41.4598 16.9925 39.1189 18.7276 34.8226 18.7276C30.6089 18.7276 28.3782 16.7171 28.2405 13.605Z"
                  fill="currentColor"
                />
                <path
                  d="M18.9126 18.6989L13.2393 3.96484H16.9847L20.2345 13.3561C20.4273 13.9344 20.4548 14.4577 20.4548 15.0085C20.4548 15.2013 20.4824 15.4767 20.7853 15.4767C21.0883 15.4767 21.1158 15.2288 21.1158 15.0085C21.1158 14.4853 21.1709 13.9344 21.3637 13.3561L24.4757 3.96484H28.2212L22.0522 20.1861C21.0607 22.7749 19.6837 23.7939 17.15 23.7939H14.5061V20.7094H15.7179C17.811 20.7094 18.2241 20.7094 18.6096 19.5802L18.9126 18.6989Z"
                  fill="currentColor"
                />
                <path
                  d="M0 13.605H3.47008C3.49762 14.6791 4.13105 15.9735 6.6923 15.9735C8.95061 15.9735 9.6942 15.2024 9.6942 14.2385C9.6942 13.1644 8.2621 12.9992 5.48053 12.6687C1.01899 12.1179 0.440645 9.80448 0.440645 8.1796C0.440645 5.81113 2.53371 3.74561 6.66476 3.74561C10.4929 3.74561 12.5859 5.78359 12.7787 8.42746H9.30864C9.22602 7.51863 8.62013 6.49964 6.58214 6.49964C4.5717 6.49964 3.96581 7.16061 3.96581 7.98682C3.96581 8.67533 4.26875 9.25367 7.10541 9.52908C10.6581 9.8871 13.2194 11.0438 13.2194 13.9631C13.2194 16.9925 10.8784 18.7276 6.58214 18.7276C2.36847 18.7276 0.137702 16.7171 0 13.605Z"
                  fill="currentColor"
                />
                <path
                  d="M93.2888 0.0820312H101V1.23873C97.8031 4.40357 97.2891 7.84152 97.0802 11.3919H95.6665C95.9396 7.56842 96.775 4.0662 99.6828 1.25479C99.747 1.2066 99.8434 1.1102 99.7952 1.02988C99.731 0.917423 99.5864 0.997748 99.5221 1.02988C99.2811 1.1584 98.9438 1.17447 98.4779 1.17447H93.2888V0.0820312Z"
                  fill="currentColor"
                />
              </svg>
            </span>
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
          <a href="#phone" className="phone-pill" aria-label="Talk to AI System 7">
            <span className="voice-waveform" aria-hidden="true">
              <span className="wave-bar" />
              <span className="wave-bar" />
              <span className="wave-bar" />
              <span className="wave-bar" />
            </span>
            <span className="live-dot" aria-hidden="true" />
            <span className="pill-label">Talk to AI System 7</span>
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
            <a href="/creator" className="route-card tiltable" data-route="creator">
              <span className="scan-line" />
              <div className="route-card-inner">
                <h3 className="route-label">Creator</h3>
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

            <a href="/revops" className="route-card tiltable" data-route="revops">
              <span className="scan-line" />
              <div className="route-card-inner">
                <h3 className="route-label">RevOps</h3>
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
                <h3 className="route-label">Build</h3>
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
