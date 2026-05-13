/* S7 Labs · Agent Lab — interactions */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─── header hide on scroll down, show on scroll up ─── */
  const header = $('#siteHeader');
  let lastY = window.scrollY;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > lastY && y > 120) header.classList.add('hidden');
    else header.classList.remove('hidden');
    lastY = y;
  }, { passive: true });

  /* ─── cursor spotlight ─── */
  const spot = $('.bg-spotlight');
  window.addEventListener('mousemove', e => {
    if (!spot) return;
    spot.style.setProperty('--mx', e.clientX + 'px');
    spot.style.setProperty('--my', e.clientY + 'px');
  });

  /* ─── reveal-on-scroll ─── */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('in');
        // staggered children
        const kind = en.target.dataset.stagger;
        if (kind) staggerChildren(en.target, kind);
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.16, rootMargin: '0px 0px -10% 0px' });

  $$('.reveal').forEach(el => io.observe(el));

  function staggerChildren(root, sel) {
    const items = $$(sel, root);
    items.forEach((el, i) => setTimeout(() => el.classList.add('in'), 90 * i));
  }

  /* ─── §01 — chatbot vs agent: stagger the comparison rows, agent col illuminates ~200ms after chatbot ─── */
  const vsSec = $('[data-sec="01"]');
  if (vsSec) {
    const vsObs = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          const botRows = $$('.vs-list[data-side="bot"] li', vsSec);
          const agRows = $$('.vs-list[data-side="agent"] li', vsSec);
          botRows.forEach((li, i) => setTimeout(() => li.classList.add('in'), 120 * i));
          agRows.forEach((li, i) => setTimeout(() => li.classList.add('in'), 120 * i + 200));
          vsObs.unobserve(en.target);
        }
      });
    }, { threshold: 0.25 });
    vsObs.observe(vsSec);
  }

  /* ─── §02 — Agent OS strata illuminate one-by-one ─── */
  const xsec = $('#agent-os');
  if (xsec) {
    const xObs = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          const strata = $$('.stratum', xsec);
          const callouts = $$('.callout', xsec);
          strata.forEach((s, i) => {
            setTimeout(() => {
              const amb = s.dataset.lyr === '4';
              s.classList.add('lit');
              if (amb) s.classList.add('amb-lit');
              if (callouts[i]) {
                callouts[i].classList.add('lit');
                if (amb) callouts[i].classList.add('amb-lit');
              }
            }, 240 * i);
          });
          xObs.unobserve(en.target);
        }
      });
    }, { threshold: 0.18 });
    xObs.observe(xsec);

    // hover sync: hovering a stratum highlights its callout (and vice-versa)
    $$('.stratum', xsec).forEach(s => {
      s.addEventListener('mouseenter', () => syncHover(s.dataset.lyr, true));
      s.addEventListener('mouseleave', () => syncHover(s.dataset.lyr, false));
    });
    $$('.callout', xsec).forEach(c => {
      c.addEventListener('mouseenter', () => syncHover(c.dataset.lyr, true));
      c.addEventListener('mouseleave', () => syncHover(c.dataset.lyr, false));
    });
    function syncHover(lyr, on) {
      const s = $(`.stratum[data-lyr="${lyr}"]`);
      const c = $(`.callout[data-lyr="${lyr}"]`);
      if (s) s.style.outline = on ? '1px solid rgba(4,227,238,0.5)' : '';
      if (c) c.style.outline = on ? '1px solid rgba(4,227,238,0.5)' : '';
    }
  }

  /* ─── §03 — role cards stagger ─── */
  const rolesSec = $('[data-sec="03"]');
  if (rolesSec) {
    const rObs = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          $$('.role', rolesSec).forEach((c, i) => setTimeout(() => c.classList.add('in'), 120 * i));
          rObs.unobserve(en.target);
        }
      });
    }, { threshold: 0.18 });
    rObs.observe(rolesSec);
  }

  /* ─── §05 — connector cards stagger ─── */
  const connSec = $('[data-sec="05"]');
  if (connSec) {
    const cObs = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          $$('.conn', connSec).forEach((c, i) => setTimeout(() => c.classList.add('in'), 120 * i));
          cObs.unobserve(en.target);
        }
      });
    }, { threshold: 0.18 });
    cObs.observe(connSec);
  }

  /* ─── §06 — governance tiles stagger + log lines stream ─── */
  const govSec = $('[data-sec="06"]');
  if (govSec) {
    const gObs = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          $$('.gcard', govSec).forEach((c, i) => setTimeout(() => c.classList.add('in'), 100 * i));
          $$('.log-strip .log-line', govSec).forEach((l, i) => setTimeout(() => l.classList.add('in'), 700 + 220 * i));
          gObs.unobserve(en.target);
        }
      });
    }, { threshold: 0.18 });
    gObs.observe(govSec);
  }

  /* ─── HERO typewriter on first line ─── */
  const l1 = $('.hero-title .l1');
  const typed = $('.typed', l1);
  const l2 = $('.hero-title .l2');
  if (typed) {
    if (reduce) {
      typed.textContent = typed.dataset.text;
      l1?.classList.add('done');
      l2?.classList.add('show');
    } else {
      const text = typed.dataset.text || '';
      let i = 0;
      const tick = () => {
        typed.textContent = text.slice(0, ++i);
        if (i < text.length) setTimeout(tick, 70 + Math.random() * 30);
        else {
          setTimeout(() => {
            l1.classList.add('done');
            l2.classList.add('show');
          }, 420);
        }
      };
      setTimeout(tick, 480);
    }
  }

  /* ─── HUD live clock ─── */
  const clockEl = $('#hudClock');
  if (clockEl) {
    const start = Date.now();
    const t0 = parseClock('04:37:18');
    setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      clockEl.textContent = formatClock(t0 + elapsed);
    }, 1000);
  }
  function parseClock(s) {
    const [h, m, sec] = s.split(':').map(Number);
    return h * 3600 + m * 60 + sec;
  }
  function formatClock(total) {
    total = total % 86400;
    const h = String(Math.floor(total / 3600)).padStart(2, '0');
    const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
    const s = String(total % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  /* ─── HUD status cycler ─── */
  const cycler = $('#hudCycler');
  const cycle = [
    'reading.context',
    'tool.call.ready',
    'approval.required',
    'action.logged',
    'handing.off',
    'audit.synced',
  ];
  if (cycler) {
    let i = 0;
    setInterval(() => {
      i = (i + 1) % cycle.length;
      cycler.style.opacity = '0';
      setTimeout(() => {
        cycler.textContent = cycle[i];
        cycler.style.opacity = '1';
      }, 260);
    }, 2200);
  }

  /* ─── Gantt foot audit stream ─── */
  const stream = $('#gfStream');
  const auditLines = [
    '[12:04:18] <span class="ag">agent.research</span> → tool.brave_search · <span class="v">query.dispatched</span>',
    '[12:04:21] <span class="ag">agent.research</span> → context.brief.draft · <span class="v">confidence=0.92</span>',
    '[12:04:23] <span style="color:var(--amber)">human.gate</span> → approval.requested · <span style="color:var(--amber)">pending</span>',
    '[12:04:47] <span style="color:var(--amber)">human.gate</span> → approved · <span style="color:var(--green)">action.logged</span>',
    '[12:04:51] <span class="ag">agent.operator</span> → tool.crm.update · <span class="v">record.synced</span>',
    '[12:04:54] <span class="ag">agent.orchestrator</span> → agent.report · <span class="v">handoff</span>',
    '[12:04:56] <span class="ag">agent.report</span> → summary.published · <span style="color:var(--green)">ok</span>',
  ];
  if (stream) {
    let i = 0;
    const advance = () => {
      i = (i + 1) % auditLines.length;
      const next = document.createElement('span');
      next.className = 'gl';
      next.innerHTML = auditLines[i];
      stream.innerHTML = '';
      stream.appendChild(next);
    };
    setInterval(advance, 2400);
  }

  /* ─── §06 audit-stream rotation (cycle log lines visibility) ─── */
  const logStrip = $('#logStrip');
  if (logStrip) {
    const lines = $$('.log-line', logStrip);
    let head = 0;
    setInterval(() => {
      head = (head + 1) % lines.length;
      lines.forEach((ln, idx) => {
        const distance = (idx - head + lines.length) % lines.length;
        ln.style.opacity = String(Math.max(0.25, 1 - distance * 0.13));
      });
    }, 1800);
  }

})();
