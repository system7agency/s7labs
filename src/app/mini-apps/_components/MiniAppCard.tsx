'use client'

import { useEffect, useRef, useState } from 'react'

import type { MiniApp } from '../_data/apps'

type MiniAppCardProps = {
  app: MiniApp
  index: number
  onInterested: (app: MiniApp) => void
  onLearnMore: (app: MiniApp) => void
  onLaunch: (app: MiniApp) => void
}

const CHIP_LABEL: Record<MiniApp['status'], string> = {
  live: 'LIVE',
  beta: 'BETA',
  new: 'NEW',
  prototype: 'PROTOTYPE',
  'coming-soon': 'SOON',
}

const CHIP_CLASS: Record<MiniApp['status'], string> = {
  live: 'live',
  beta: 'beta',
  new: 'new',
  prototype: 'prototype',
  'coming-soon': 'soon',
}

const GLYPHS = ['◇', '◉', '⌁', '∆', '∑', 'Σ', '◎', '⊙', '◈']

function toCommand(id: string): string {
  return id.replace(/-/g, '_')
}

function pickGlyph(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return GLYPHS[h % GLYPHS.length] ?? '◇'
}

export function MiniAppCard({ app, index, onInterested, onLearnMore, onLaunch }: MiniAppCardProps) {
  const launchable =
    (app.status === 'live' || app.status === 'beta' || app.status === 'new') && !!app.launch_url
  const arrowLabel = launchable ? 'ENTER' : app.status === 'coming-soon' ? 'NOTIFY' : 'LEARN'

  const [typed, setTyped] = useState('')
  const [typeDone, setTypeDone] = useState(false)
  const cancelRef = useRef(false)

  useEffect(() => {
    cancelRef.current = false
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const full = toCommand(app.id)
    let i = 0
    let typeTimer: ReturnType<typeof setTimeout> | null = null
    const step = () => {
      if (cancelRef.current) return
      if (i >= full.length) {
        setTypeDone(true)
        return
      }
      i += 1
      setTyped(full.slice(0, i))
      typeTimer = setTimeout(step, 38 + Math.random() * 30)
    }
    const startDelay = prefersReduced ? 0 : 240 + index * 220
    const startTimer = setTimeout(
      () => {
        if (prefersReduced) {
          setTyped(full)
          setTypeDone(true)
        } else {
          step()
        }
      },
      prefersReduced ? 0 : startDelay
    )
    return () => {
      cancelRef.current = true
      clearTimeout(startTimer)
      if (typeTimer) clearTimeout(typeTimer)
    }
  }, [app.id, index])

  const handlePrimary = () => {
    if (launchable) onLaunch(app)
    else onLearnMore(app)
  }

  const glyph = pickGlyph(app.id)
  const routeNum = String(index + 1).padStart(2, '0')

  return (
    <article
      className={`mx-card${launchable ? '' : 'is-soft'}`}
      data-status={app.status}
      data-id={app.id}
      role="button"
      tabIndex={0}
      onClick={handlePrimary}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handlePrimary()
        }
      }}
      aria-label={`${app.name} — ${arrowLabel}`}
    >
      <span className="mx-scan-line" aria-hidden />
      <div className="mx-glyphs" aria-hidden>
        <span style={{ top: '14%', right: '14%' }}>{`// ${app.cats[0] ?? 'app'}`}</span>
        <span style={{ top: '70%', right: '10%' }}>{glyph}</span>
        <span style={{ top: '46%', left: '8%' }}>{`> ${app.tags[0] ?? 'run'}`}</span>
      </div>
      <span className={`mx-chip ${CHIP_CLASS[app.status]}`} aria-hidden>
        <i />
        {CHIP_LABEL[app.status]}
      </span>
      <div className="mx-card-inner">
        <span className="mx-index">
          APP_{routeNum}
          <span className="mx-name-side">{app.name}</span>
        </span>
        <div className="mx-label">
          <span className="mx-prompt">$</span>
          <span className="mx-typed">{typed}</span>
          <span className={`mx-cursor${typeDone ? 'done' : ''}`} />
        </div>
        <p className="mx-tagline">{app.short_description}</p>
        <div className="mx-meta">
          <span className="mx-tag">{app.category.toUpperCase()}</span>
          <span className="mx-actions">
            <button
              type="button"
              className="mx-mini"
              onClick={(e) => {
                e.stopPropagation()
                onInterested(app)
              }}
            >
              + interested
            </button>
            <span className="mx-arrow" aria-hidden>
              <span>{arrowLabel}</span>
              <span className="a">→</span>
            </span>
          </span>
        </div>
      </div>
    </article>
  )
}
