export function ShippedSection() {
  return (
    <section className="sec reveal">
      <div className="sec-tag">
        <span className="n">01</span>
        <span className="lbl">
          <span>{'// 01 / 04'}</span>
          <span className="v">SHIPPED</span>
        </span>
      </div>
      <div className="sec-head">
        <div className="left">
          <h2>
            Live, in production, in use <span className="accent-text">today</span>.
          </h2>
          <p>Two products we built end-to-end. Click through to use them — they&rsquo;re real.</p>
        </div>
        <div className="right">
          <span className="pulse-d" />
          <span>2 / 2 LIVE</span>
        </div>
      </div>

      {/* Product 1: Meet-Ting — phone on left, meta on right */}
      <div className="ship-layout">
        <div className="phone" data-product>
          <div className="phone-screen">
            <div className="phone-status">
              <span>9:41</span>
              <span>5G · ●●●●</span>
            </div>
            <div className="wa-head">
              <span className="ava">T</span>
              <span className="who">
                <span className="nm">Ting</span>
                <span className="st">online · scheduling</span>
              </span>
            </div>
            <div className="wa-chat">
              <div className="bubble me">
                Hey Ting — find a slot for me, Sarah &amp; Jamie next week?
                <span className="t">09:14</span>
              </div>
              <div className="bubble ting">
                On it. Pulling everyone&rsquo;s calendars…
                <span className="t">09:14</span>
              </div>
              <div className="bubble ting">
                Three slots match for all three of you:
                <div className="slots">
                  <span className="slot">Tue 14:00</span>
                  <span className="slot pick">Wed 10:30</span>
                  <span className="slot">Thu 16:00</span>
                </div>
                <span className="t">09:14</span>
              </div>
              <div className="bubble me">
                Wed 10:30 please.
                <span className="t">09:15</span>
              </div>
              <div className="bubble ting">
                Booked. Calendar invites sent to all three. ✓
                <span className="t">09:15</span>
              </div>
              <div className="typing-dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
            </div>
            <div className="wa-input">
              <span className="fld">Message Ting…</span>
            </div>
          </div>
        </div>
        <div className="ship-right">
          <div className="ship-meta" data-product-meta>
            <span className="corner tl" />
            <span className="corner br" />
            <div className="pill">BUILD_01 · LIVE</div>
            <div className="wm">
              <span className="bk">{'{'}</span>
              Meet-Ting
              <span className="bk">{'}'}</span>
            </div>
            <div className="tag">
              AI SCHEDULING <span className="v">·</span> EMAIL + WHATSAPP
            </div>
            <p className="desc">
              CC ting@meet-ting.com on email or text it on WhatsApp. It reads the thread, checks
              everyone&rsquo;s calendars, books the meeting. Zero apps, zero clicks, zero account
              required.
            </p>
            <div className="stats">
              <div className="stat">
                <div className="k">PRICE</div>
                <div className="vv acc">FREE</div>
              </div>
              <div className="stat">
                <div className="k">APPS</div>
                <div className="vv">0</div>
              </div>
              <div className="stat">
                <div className="k">TIME TO BOOK</div>
                <div className="vv">30s</div>
              </div>
            </div>
            <a
              href="https://meet-ting.com"
              className="p-cta"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>Visit Meet-Ting</span>
              <span className="arr" aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>

      {/* Product 2: VSignal — terminal on left, meta on right */}
      <div className="terminal-layout">
        <div className="terminal" data-product>
          <div className="term-head">
            <span className="dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="title">vsignal / markets.live</span>
            <span className="badge">
              LIVE · <span id="vsClock">14:22:08 UTC</span>
            </span>
          </div>
          <div className="term-body">
            <div className="term-line">
              <span className="prompt">$</span>
              <span className="out">vsignal --watch BTC,ETH,SOL --signals</span>
            </div>
            <div className="term-line">
              <span className="dim">⤷ connecting to 12 exchanges...</span>
            </div>
            <div className="term-line">
              <span className="green">✓</span>
              <span className="dim">streaming established · feeding signal engine</span>
            </div>
            <div className="term-table">
              <span className="h">SYM</span>
              <span className="h" />
              <span className="h">NAME</span>
              <span className="h">CHG 24H</span>
              <span className="h">VOL</span>
              <span className="sym">BTC</span>
              <span className="pr">$67,412</span>
              <span className="nm">Bitcoin</span>
              <span className="chg up">+2.41%</span>
              <span className="vol">28.4B</span>
              <span className="sym">ETH</span>
              <span className="pr">$3,548</span>
              <span className="nm">Ethereum</span>
              <span className="chg up">+1.18%</span>
              <span className="vol">14.7B</span>
              <span className="sym">SOL</span>
              <span className="pr">$182.40</span>
              <span className="nm">Solana</span>
              <span className="chg down">−0.74%</span>
              <span className="vol">3.2B</span>
            </div>
            <div className="term-chart">
              <span className="lbl">
                BTC · 24H · <span className="v">+2.41%</span>
              </span>
              <svg viewBox="0 0 240 60" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <linearGradient id="vsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="var(--accent)" stopOpacity="0.35" />
                    <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 42 L20 36 L40 40 L60 28 L80 32 L100 22 L120 26 L140 14 L160 20 L180 12 L200 18 L220 8 L240 16 L240 60 L0 60 Z"
                  fill="url(#vsGrad)"
                />
                <path
                  d="M0 42 L20 36 L40 40 L60 28 L80 32 L100 22 L120 26 L140 14 L160 20 L180 12 L200 18 L220 8 L240 16"
                  stroke="var(--accent)"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="chart-line"
                />
                <circle cx="220" cy="8" r="3" fill="var(--accent)" className="chart-dot" />
              </svg>
            </div>
            <div className="term-line" style={{ marginTop: 14 }}>
              <span className="green">●</span>
              <span className="v">SIGNAL</span>
              <span className="out">BTC breakout above 67K · confidence 0.82</span>
            </div>
            <div className="term-line">
              <span className="red">●</span>
              <span className="v">SIGNAL</span>
              <span className="out">SOL bearish divergence · 15m chart</span>
            </div>
            <div className="term-line">
              <span className="prompt">$</span>
              <span className="out">_</span>
              <span className="term-cursor" aria-hidden="true" />
            </div>
          </div>
        </div>
        <div className="ship-right">
          <div className="ship-meta" data-product-meta>
            <span className="corner tl" />
            <span className="corner br" />
            <div className="pill">BUILD_02 · LIVE</div>
            <div className="wm">
              <span className="bk">[</span>
              VSignal
              <span className="bk">]</span>
            </div>
            <div className="tag">
              CRYPTO INTELLIGENCE <span className="v">·</span> REAL-TIME
            </div>
            <p className="desc">
              Real-time crypto price tracking and signal intelligence for traders who need data,
              not noise. 12 exchanges, sub-second latency, signal engine on top.
            </p>
            <div className="stats">
              <div className="stat">
                <div className="k">FEED</div>
                <div className="vv">LIVE</div>
              </div>
              <div className="stat">
                <div className="k">LATENCY</div>
                <div className="vv acc">&lt;1s</div>
              </div>
              <div className="stat">
                <div className="k">GRADE</div>
                <div className="vv">TRADER</div>
              </div>
            </div>
            <a
              href="https://vsignal.ai"
              className="p-cta"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>Visit VSignal</span>
              <span className="arr" aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
