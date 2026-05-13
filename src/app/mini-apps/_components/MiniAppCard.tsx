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
      <button
        type="button"
        className="card-inner"
        onClick={handleThumbClick}
        aria-label={`Open ${app.name}`}
        style={{ all: 'unset', display: 'block', cursor: 'pointer', width: '100%' }}
      >
        <span className="card-face card-front">
          <CardThumb thumb={app.thumb} />
          <span className={`card-chip ${CHIP_CLASS[app.status]}`}>
            <i />
            {CHIP_LABEL[app.status]}
          </span>
        </span>
        <span className="card-face card-back">
          <p className="cb-desc">{app.learn_more.what_it_does}</p>
          <div className="cb-io">
            <div className="cb-row">
              <span className="lbl">IN</span>
              <span>{app.learn_more.how_it_works.inputs.join(' · ')}</span>
            </div>
            <div className="cb-row">
              <span className="lbl">OUT</span>
              <span>{app.learn_more.how_it_works.outputs.join(' · ')}</span>
            </div>
          </div>
          <p className="cb-build">
            {app.learn_more.build_potential.replace(/^Could become a? ?/i, '')}
          </p>
        </span>
      </button>
      <div className="card-body">
        <div className="card-name">{app.name}</div>
        <p className="card-sub">{app.short_description}</p>
        <div className="card-tags">
          {app.tags.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
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
