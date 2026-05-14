import './LabTitleHero.css'

type MetaItem = { label: string; accent?: boolean }

type LabTitleHeroProps = {
  eyebrow: string
  name: string
  bgWord: string
  subtitle?: string
  meta?: MetaItem[]
  scrollHint?: string
}

export function LabTitleHero({
  eyebrow,
  name,
  bgWord,
  subtitle,
  meta,
  scrollHint,
}: LabTitleHeroProps) {
  return (
    <section className="lab-title-hero">
      <div className="lth-eyebrow">
        <span className="lth-dot" />
        {eyebrow}
      </div>

      <div className="lth-title-wrap">
        <div className="lth-rings" aria-hidden="true">
          <div className="lth-ring" />
          <div className="lth-ring r2" />
          <div className="lth-ring r3" />
        </div>
        <div className="lth-bg-word" aria-hidden="true">
          {bgWord}
        </div>
        <h1 className="lth-title">
          <span className="lth-accent">{name}</span>
        </h1>
      </div>

      {subtitle ? <p className="lth-subtitle">{subtitle}</p> : null}

      {meta && meta.length > 0 ? (
        <div className="lth-meta">
          {meta.map((item, i) => (
            <span key={`${item.label}-${i}`} style={{ display: 'contents' }}>
              <span className={item.accent ? 'v' : undefined}>{item.label}</span>
              {i < meta.length - 1 ? <span className="sep" /> : null}
            </span>
          ))}
        </div>
      ) : null}

      {scrollHint ? (
        <div className="lth-scroll-hint">
          <span>{scrollHint}</span>
          <span className="line" />
        </div>
      ) : null}
    </section>
  )
}
