import type { AppThumb } from '../_data/apps'

type CardThumbProps = {
  thumb: AppThumb
}

export function CardThumb({ thumb }: CardThumbProps) {
  switch (thumb) {
    case 'score':
      return (
        <div className="card-thumb thumb-score">
          <div className="sc-row">
            <span className="sc-label" />
            <span className="sc-bar sc-bar-danger" style={{ width: '72%' }} />
            <span className="sc-val sc-danger">7</span>
          </div>
          <div className="sc-row">
            <span className="sc-label" />
            <span className="sc-bar sc-bar-warn" style={{ width: '54%' }} />
            <span className="sc-val sc-warn">C+</span>
          </div>
          <div className="sc-row sc-row-hi">
            <span className="sc-label" />
            <span className="sc-bar sc-bar-accent" style={{ width: '88%' }} />
            <span className="sc-val sc-accent">Fix</span>
          </div>
        </div>
      )
    case 'radar':
      return (
        <div className="card-thumb thumb-radar">
          <span className="rd-ring rd-ring-1" />
          <span className="rd-ring rd-ring-2" />
          <span className="rd-ring rd-ring-3" />
          <span className="rd-dot rd-dot-1" />
          <span className="rd-dot rd-dot-2" />
          <span className="rd-dot rd-dot-3" />
          <span className="rd-sweep" />
        </div>
      )
  }
}
