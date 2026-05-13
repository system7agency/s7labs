const ROWS = [
  {
    live: true,
    perms: 'drwxr-xr-x',
    sz: '2.4M',
    date: 'May 13 14:22',
    when: 'live',
    name: 'meet-ting',
    ext: '.app',
    tag: 'BUILD_01 · LIVE',
    stealth: false,
  },
  {
    live: true,
    perms: 'drwxr-xr-x',
    sz: '5.8M',
    date: 'May 13 09:08',
    when: 'live',
    name: 'vsignal',
    ext: '.ai',
    tag: 'BUILD_02 · LIVE',
    stealth: false,
  },
  {
    live: false,
    perms: 'drwx------',
    sz: '—',
    date: 'Jul 04 02:13',
    when: 'Q3 2026',
    name: 'build_03',
    ext: '',
    tag: 'IN DEVELOPMENT',
    stealth: true,
  },
  {
    live: false,
    perms: 'drwx------',
    sz: '—',
    date: 'Oct 22 18:40',
    when: 'Q4 2026',
    name: 'build_04',
    ext: '',
    tag: 'IN DEVELOPMENT',
    stealth: true,
  },
  {
    live: false,
    perms: 'drwx------',
    sz: '—',
    date: '— — —',
    when: 'pending',
    name: 'build_05',
    ext: '',
    tag: 'CONCEPT',
    stealth: true,
  },
] as const

export function InDevelopmentSection() {
  return (
    <section className="sec reveal">
      <div className="sec-tag">
        <span className="n">04</span>
        <span className="lbl">
          <span>{'// 04 / 04'}</span>
          <span className="v">STEALTH</span>
        </span>
      </div>
      <div className="sec-head">
        <div className="left">
          <h2>What&rsquo;s next.</h2>
          <p>We ship something new every few months. Here&rsquo;s what&rsquo;s in the queue.</p>
        </div>
        <div className="right">
          <span>3 IN QUEUE</span>
        </div>
      </div>

      <div className="lsblock">
        <div className="lscmd" aria-hidden="true">
          <span className="prompt">$</span>
          <span>ls -la</span>
          <span className="arg">--filter</span>
          <span className="path">~/s7-labs/builds/</span>
        </div>

        {ROWS.map((r) => (
          <div
            key={r.name}
            className={['lsline', r.live && 'live'].filter(Boolean).join(' ')}
            data-ls
          >
            <span className={['perms', r.live ? 'live-p' : 'r'].filter(Boolean).join(' ')}>
              {r.perms}
            </span>
            <span className="sz">{r.sz}</span>
            <span className="date">{r.date}</span>
            <span className="when">{r.when}</span>
            <span className="nm">
              {r.stealth ? <span className="stealth">{r.name}</span> : r.name}
              {r.ext ? <span className="ext">{r.ext}</span> : null}
            </span>
            <span className="tag">{r.tag}</span>
          </div>
        ))}

        <div className="lsfoot">
          5 items · <span className="v">2 live</span> · 3 pending — protected by NDA{' '}
          <span className="v">*</span>
        </div>
      </div>
    </section>
  )
}
