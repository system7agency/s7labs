import type { AppThumb } from '../_data/apps'

type CardThumbProps = {
  thumb: AppThumb
}

export function CardThumb({ thumb }: CardThumbProps) {
  switch (thumb) {
    case 'roast':
      return (
        <div className="card-thumb thumb-roast">
          <div className="rt-browser">
            <span className="rt-bar" />
            <span className="rt-line" style={{ width: '80%' }} />
            <span className="rt-line" style={{ width: '55%' }} />
            <span className="rt-line rt-line-hi" style={{ width: '40%' }} />
          </div>
          <span className="rt-badge">C+</span>
        </div>
      )
    case 'aio':
      return (
        <div className="card-thumb thumb-aio">
          <div className="aio-search">
            <span className="aio-search-dot" />
            <span className="aio-search-line" />
          </div>
          <div className="aio-summary">
            <span className="aio-sm-line aio-sm-main" />
            <span className="aio-sm-line" />
            <span className="aio-sm-line" />
          </div>
          <div className="aio-cites">
            <span className="aio-cite aio-cite-rival" />
            <span className="aio-cite aio-cite-empty" />
            <span className="aio-cite" />
          </div>
        </div>
      )
    case 'sov':
      return (
        <div className="card-thumb thumb-sov">
          <div className="sov-bars">
            <span className="sov-bar sov-bar-you" />
            <span className="sov-bar sov-bar-rival" />
            <span className="sov-bar sov-bar-mid" />
          </div>
        </div>
      )
    case 'stack':
      return (
        <div className="card-thumb thumb-stack">
          <div className="st-layers">
            <span className="st-tile st-tile-1">
              <span className="st-tile-label" />
            </span>
            <span className="st-tile st-tile-2">
              <span className="st-tile-label" />
            </span>
            <span className="st-tile st-tile-3">
              <span className="st-tile-label" />
            </span>
            <span className="st-tile st-tile-4">
              <span className="st-tile-label" />
            </span>
          </div>
        </div>
      )
    case 'blueprint':
      return (
        <div className="card-thumb thumb-blueprint">
          <div className="bp-flow">
            <span className="bp-node" />
            <span className="bp-arrow">→</span>
            <span className="bp-node" />
            <span className="bp-arrow">→</span>
            <span className="bp-node bp-node-end" />
          </div>
          <span className="bp-auto-badge">⚡</span>
        </div>
      )
    case 'sanity':
      return (
        <div className="card-thumb thumb-sanity">
          <div className="sn-row sn-row-crit">
            <span className="sn-field" />
            <span className="sn-bar sn-bar-crit" />
            <span className="sn-dot sn-crit" />
          </div>
          <div className="sn-row sn-row-warn">
            <span className="sn-field" />
            <span className="sn-bar sn-bar-warn" />
            <span className="sn-dot sn-warn" />
          </div>
          <div className="sn-row sn-row-ok">
            <span className="sn-field" />
            <span className="sn-bar sn-bar-ok" />
            <span className="sn-dot sn-ok" />
          </div>
          <div className="sn-score">
            <span className="sn-score-num">74</span>
          </div>
        </div>
      )
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
    case 'proposal':
      return (
        <div className="card-thumb thumb-proposal">
          <div className="pr-doc">
            <span className="pr-line" style={{ width: '88%' }} />
            <span className="pr-line pr-heading" style={{ width: '55%' }} />
            <span className="pr-line" style={{ width: '75%' }} />
            <span className="pr-line" style={{ width: '65%' }} />
          </div>
          <span className="pr-badge">S7</span>
        </div>
      )
  }
}
