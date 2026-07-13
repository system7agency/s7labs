import './(marketing)/landing/page-styles.css'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'

import { PageScripts } from './(marketing)/landing/PageScripts'
import { RouteIndexB } from './(marketing)/landing/RouteIndexB'

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
            <span className="routes-count">04 / 04</span>
          </div>

          <RouteIndexB />
        </section>
      </main>

      <Footer />

      <PageScripts />
    </>
  )
}
