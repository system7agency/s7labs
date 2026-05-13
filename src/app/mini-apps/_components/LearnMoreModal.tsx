'use client'

import { useEffect, useRef } from 'react'

import type { MiniApp } from '../_data/apps'
import { CardThumb } from './CardThumb'

type LearnMoreModalProps = {
  app: MiniApp
  onClose: () => void
  onInterested: (app: MiniApp) => void
  onLaunch: (app: MiniApp) => void
}

const CHIP_CLASS: Record<MiniApp['status'], string> = {
  live: '',
  beta: 'beta',
  new: 'new',
  prototype: 'prototype',
  'coming-soon': 'soon',
}

const CHIP_LABEL: Record<MiniApp['status'], string> = {
  live: 'LIVE',
  beta: 'BETA',
  new: 'NEW',
  prototype: 'PROTOTYPE',
  'coming-soon': 'COMING SOON',
}

export function LearnMoreModal({ app, onClose, onInterested, onLaunch }: LearnMoreModalProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  const launchable =
    (app.status === 'live' || app.status === 'beta' || app.status === 'new') && !!app.launch_url

  return (
    <div
      className="mx-backdrop open"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="mx mx-learn" role="dialog" aria-modal="true" aria-labelledby="learnTitle">
        <button
          ref={closeRef}
          type="button"
          className="mx-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <div className="mx-grid">
          <div className="mx-left">
            <div className={`mx-chip ${CHIP_CLASS[app.status]}`}>
              <i />
              {CHIP_LABEL[app.status]}
            </div>
            <div className="mx-preview">
              <CardThumb thumb={app.thumb} />
            </div>
            <div className="mx-cat">CATEGORY · {app.category.toUpperCase()}</div>
          </div>
          <div className="mx-right">
            <div className="mx-eye">
              {'// MINI-APP · '}
              <span className="v">{app.id}</span>
            </div>
            <h3 id="learnTitle">{app.name}</h3>
            <p className="mx-lead">{app.short_description}</p>

            <div className="mx-section">
              <div className="ms-lbl">WHAT IT DOES</div>
              <p>{app.learn_more.what_it_does}</p>
            </div>
            <div className="mx-section">
              <div className="ms-lbl">HOW IT WORKS</div>
              <div className="ms-io">
                <div className="ms-row">
                  <span className="lbl">IN</span>
                  <span>{app.learn_more.how_it_works.inputs.join(' · ')}</span>
                </div>
                <div className="ms-row">
                  <span className="lbl">OUT</span>
                  <span>{app.learn_more.how_it_works.outputs.join(' · ')}</span>
                </div>
              </div>
            </div>
            <div className="mx-section">
              <div className="ms-lbl">WHO IT&rsquo;S FOR</div>
              <p>{app.learn_more.who_its_for}</p>
            </div>
            <div className="mx-section">
              <div className="ms-lbl">BUILD POTENTIAL</div>
              <p className="v-text">{app.learn_more.build_potential}</p>
            </div>

            <div className="mx-actions">
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
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
