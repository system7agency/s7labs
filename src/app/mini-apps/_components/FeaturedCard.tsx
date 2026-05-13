'use client'

import type { MiniApp } from '../_data/apps'
import { CardThumb } from './CardThumb'

type FeaturedCardProps = {
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

export function FeaturedCard({ app, onInterested, onLearnMore, onLaunch }: FeaturedCardProps) {
  const launchable =
    (app.status === 'live' || app.status === 'beta' || app.status === 'new') && !!app.launch_url

  const handleThumbClick = () => {
    if (launchable) onLaunch(app)
    else if (app.status === 'prototype') onLearnMore(app)
    else onInterested(app)
  }

  return (
    <article className="fcard" data-status={app.status} data-id={app.id}>
      <div
        className="fcard-thumb-wrap"
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
      >
        <CardThumb thumb={app.thumb} />
        <span className={`card-chip ${CHIP_CLASS[app.status]}`}>
          <i />
          {CHIP_LABEL[app.status]}
        </span>
      </div>
      <div className="fcard-body">
        <div className="fcard-eye">
          {'// FEATURED · '}
          <span className="v">{CHIP_LABEL[app.status]}</span>
        </div>
        <h3 className="fcard-name">{app.name}</h3>
        <p className="fcard-sub">{app.short_description}</p>
        <p className="fcard-detail">{app.learn_more.what_it_does}</p>
        <div className="fcard-tags">
          {app.tags.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
        <div className="fcard-actions">
          <button type="button" className="ca-btn ca-primary" onClick={() => onInterested(app)}>
            <span>Interested</span>
          </button>
          {launchable ? (
            <button type="button" className="ca-btn ca-ghost" onClick={() => onLaunch(app)}>
              <span>Open app</span>
              <span className="arr" aria-hidden="true">
                →
              </span>
            </button>
          ) : (
            <button type="button" className="ca-btn ca-ghost" onClick={() => onLearnMore(app)}>
              <span>Learn more</span>
              <span className="arr" aria-hidden="true">
                →
              </span>
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
