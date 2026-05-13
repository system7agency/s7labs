import type { AppThumb } from '../_data/apps'

type CardThumbProps = {
  thumb: AppThumb
}

export function CardThumb({ thumb }: CardThumbProps) {
  switch (thumb) {
    case 'chat':
      return (
        <div className="card-thumb thumb-chat">
          <span className="bb bb-l">
            <i />
            <i style={{ width: '60%' }} />
          </span>
          <span className="bb bb-r">
            <i style={{ width: '80%' }} />
            <i style={{ width: '40%' }} />
          </span>
          <span className="bb bb-l bb-cal">
            <i className="cal" />
            10:30 — Wed
          </span>
        </div>
      )
    case 'chart':
      return (
        <div className="card-thumb thumb-chart">
          <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="t-line">
            <polyline
              points="0,42 8,38 16,44 24,30 32,36 40,22 48,28 56,18 64,24 72,12 80,18 88,10 100,16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
            />
          </svg>
          <span className="sig sig-1" />
          <span className="sig sig-2" />
          <span className="sig sig-3" />
        </div>
      )
    case 'doc':
      return (
        <div className="card-thumb thumb-doc">
          <span className="ln" style={{ width: '90%' }} />
          <span className="ln hi" style={{ width: '60%' }} />
          <span className="ln" style={{ width: '80%' }} />
          <span className="ln hi" style={{ width: '45%' }} />
          <span className="ln" style={{ width: '75%' }} />
          <span className="ln hi" style={{ width: '55%' }} />
        </div>
      )
    case 'rows':
      return (
        <div className="card-thumb thumb-rows">
          <span className="rr">
            <i style={{ width: '30%' }} />
            <i style={{ width: '48%', opacity: 0.4 }} />
            <i style={{ width: '22%' }} />
          </span>
          <span className="rr">
            <i style={{ width: '42%' }} />
            <i style={{ width: '30%' }} />
            <i style={{ width: '35%', opacity: 0.3 }} />
          </span>
          <span className="rr">
            <i style={{ width: '28%' }} />
            <i style={{ width: '54%' }} />
            <i style={{ width: '32%' }} />
          </span>
          <span className="rr rr-out">
            <i style={{ width: '32%' }} />
            <i style={{ width: '42%' }} />
            <i style={{ width: '30%' }} />
          </span>
          <span className="rr rr-out">
            <i style={{ width: '30%' }} />
            <i style={{ width: '40%' }} />
            <i style={{ width: '34%' }} />
          </span>
        </div>
      )
    case 'matrix':
      return (
        <div className="card-thumb thumb-matrix">
          <span className="mx" />
          <span className="mx" />
          <span className="mx mx-hi" />
          <span className="mx" />
          <span className="mx mx-hi" />
          <span className="mx" />
          <span className="mx mx-hi" />
          <span className="mx" />
          <span className="mx" />
        </div>
      )
    case 'policy':
      return (
        <div className="card-thumb thumb-doc thumb-policy">
          <span className="ln" style={{ width: '88%' }} />
          <span className="ln flag" style={{ width: '62%' }} />
          <span className="ln" style={{ width: '80%' }} />
          <span className="ln" style={{ width: '90%' }} />
          <span className="ln flag" style={{ width: '48%' }} />
          <span className="ln" style={{ width: '70%' }} />
        </div>
      )
    case 'kb':
      return (
        <div className="card-thumb thumb-kb">
          <div className="kb-q">
            <span className="kbc" />
            how do refunds work?
          </div>
          <div className="kb-srcs">
            <span className="kb-src" />
            <span className="kb-src kb-src-hi" />
            <span className="kb-src" />
            <span className="kb-src kb-src-hi" />
          </div>
        </div>
      )
    case 'brief':
      return (
        <div className="card-thumb thumb-brief">
          <div className="br-left">
            <span className="scribble" />
            <span className="scribble" style={{ width: '70%' }} />
            <span className="scribble" style={{ width: '55%' }} />
            <span className="scribble" style={{ width: '80%' }} />
          </div>
          <div className="br-arrow">→</div>
          <div className="br-right">
            <span className="br-line br-h" />
            <span className="br-line" style={{ width: '90%' }} />
            <span className="br-line" style={{ width: '70%' }} />
            <span className="br-line br-h" style={{ width: '60%' }} />
            <span className="br-line" style={{ width: '80%' }} />
          </div>
        </div>
      )
    case 'report':
      return (
        <div className="card-thumb thumb-report">
          <div className="rp-row">
            <span className="rp-k">
              <i style={{ height: '60%' }} />
            </span>
            <span className="rp-k">
              <i style={{ height: '40%' }} />
            </span>
            <span className="rp-k">
              <i style={{ height: '80%' }} />
            </span>
          </div>
          <span className="rp-line" style={{ width: '90%' }} />
          <span className="rp-line" style={{ width: '60%' }} />
        </div>
      )
    case 'form':
      return (
        <div className="card-thumb thumb-form">
          <div className="fm-form">
            <span className="fm-ln" style={{ width: '80%' }} />
            <span className="fm-ln" style={{ width: '60%' }} />
            <span className="fm-ln fm-ln-on" style={{ width: '90%' }} />
            <span className="fm-btn" />
          </div>
          <span className="fm-arrow" />
          <div className="fm-queue">
            <span className="fm-q" />
            <span className="fm-q" />
            <span className="fm-q fm-q-on" />
          </div>
        </div>
      )
    case 'fan':
      return (
        <div className="card-thumb thumb-fan">
          <span className="fan fan-src" />
          <span className="fan fan-1" />
          <span className="fan fan-2" />
          <span className="fan fan-3" />
        </div>
      )
    case 'portal':
      return (
        <div className="card-thumb thumb-portal">
          <div className="pt-top">
            <span className="pt-d" />
            <span className="pt-bar" />
          </div>
          <div className="pt-row">
            <span />
            <span style={{ width: '30%' }} />
          </div>
          <div className="pt-row pt-row-hi">
            <span />
            <span style={{ width: '48%' }} />
          </div>
          <div className="pt-row">
            <span />
            <span style={{ width: '24%' }} />
          </div>
        </div>
      )
  }
}
