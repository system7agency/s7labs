import type { AppThumb } from '../_data/apps'

type CardThumbProps = {
  thumb: AppThumb
}

export function CardThumb({ thumb }: CardThumbProps) {
  switch (thumb) {
    case 'brief':
      return (
        <div className="card-thumb thumb-brief-jb">
          <div className="jb-left">
            <span className="jb-line" style={{ width: '85%' }} />
            <span className="jb-line jb-tech" style={{ width: '55%' }} />
            <span className="jb-line" style={{ width: '70%' }} />
            <span className="jb-line jb-pain" style={{ width: '45%' }} />
          </div>
          <div className="jb-arrow">→</div>
          <div className="jb-brief">
            <span className="jb-b-line jb-b-angle" />
            <span className="jb-b-line" style={{ width: '80%' }} />
            <span className="jb-b-line" style={{ width: '65%' }} />
          </div>
        </div>
      )
    case 'hook':
      return (
        <div className="card-thumb thumb-hook">
          <div className="hk-post">
            <span className="hk-line" style={{ width: '90%' }} />
            <span className="hk-line" style={{ width: '70%' }} />
            <span className="hk-line hk-hi" style={{ width: '55%' }} />
          </div>
          <div className="hk-arrow">→</div>
          <div className="hk-hooks">
            <span className="hk-hook hk-hook-best" />
            <span className="hk-hook" />
            <span className="hk-hook" />
          </div>
        </div>
      )
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
