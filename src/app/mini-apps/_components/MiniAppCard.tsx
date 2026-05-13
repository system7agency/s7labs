'use client'

import type { MiniApp } from '../_data/apps'
import { CardThumb } from './CardThumb'

type MiniAppCardProps = {
  app: MiniApp
  onInterested: (app: MiniApp) => void
  onLearnMore: (app: MiniApp) => void
  onLaunch: (app: MiniApp) => void
}

const CHIP_LABEL: Record<MiniApp['status'], string> = {
  live: 'LIVE',
  beta: 'BETA',
  new: 'NEW',
  prototype: 'PROTOTYPE',
  'coming-soon': 'COMING SOON',
}

const CHIP_CLASS: Record<MiniApp['status'], string> = {
  live: 'live',
  beta: 'beta',
  new: 'new',
  prototype: 'prototype',
  'coming-soon': 'soon',
}

export function MiniAppCard({ app, onInterested, onLearnMore, onLaunch }: MiniAppCardProps) {
  const launchable =
    (app.status === 'live' || app.status === 'beta' || app.status === 'new') && !!app.launch_url

  const handlePrimary = () => {
    if (app.status === 'coming-soon') onInterested(app)
    else onInterested(app)
  }

  const handleThumbClick = () => {
    if (launchable) onLaunch(app)
    else if (app.status === 'prototype') onLearnMore(app)
    else onInterested(app)
  }

  return (
    <article className="card" data-status={app.status} data-id={app.id}>
      <div
        className="card-inner"
        role="button"
        tabIndex={0}
        onClick={handleThumbClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleThumbClick()
          }
        }}
        aria-label={`Open ${app.name}`}
        style={{ cursor: 'pointer' }}
      >
        <CardThumb thumb={app.thumb} />
        <span className={`card-chip ${CHIP_CLASS[app.status]}`}>
          <i />
          {CHIP_LABEL[app.status]}
        </span>
      </div>
      <div className="card-body">
        <div className="card-name">{app.name}</div>
        <p className="card-sub">{app.short_description}</p>
      </div>
      <div className="card-actions">
        <button type="button" className="ca-btn ca-primary" onClick={handlePrimary}>
          <span>Interested</span>
        </button>
        <button type="button" className="ca-btn ca-ghost" onClick={() => onLearnMore(app)}>
          <span>Learn more</span>
          <span className="arr" aria-hidden="true">
            →
          </span>
        </button>
      </div>
    </article>
  )
}
