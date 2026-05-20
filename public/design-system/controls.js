// S7 Labs · Living Design System · interactive controls (vanilla JS)

(function () {
  // Timestamp in header
  const ts = document.getElementById('ds-timestamp');
  if (ts) {
    const d = new Date();
    const pad = function (n) { return String(n).padStart(2, '0'); };
    ts.textContent =
      d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) +
      'T' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + 'Z';
  }

  // Build spacing scale bars
  const scale = [4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 64];
  const grid = document.getElementById('space-grid');
  if (grid) {
    scale.forEach(function (n) {
      const row = document.createElement('div');
      row.className = 'space-bar';
      row.innerHTML = '<b>' + n + 'px</b><div class="bar" style="width:' + (n * 4) + 'px"></div>';
      grid.appendChild(row);
    });
  }

  // Generic control wiring: every input[data-prop] updates its closest .demo
  document.querySelectorAll('.demo input[data-prop], .demo select[data-prop]').forEach(function (el) {
    const prop = el.getAttribute('data-prop');
    const unit = el.getAttribute('data-unit') || '';
    const raw = el.hasAttribute('data-raw');
    el.addEventListener('input', function () {
      const demo = el.closest('.demo');
      if (!demo) return;
      demo.style.setProperty(prop, raw ? el.value : (el.value + unit));
    });
    if (el.tagName === 'SELECT') {
      el.dispatchEvent(new Event('input'));
    }
  });

  // Toggle handlers: data-toggle = class to flip on a target inside the demo
  document.querySelectorAll('.demo input[data-toggle]').forEach(function (el) {
    el.addEventListener('change', function () {
      const demo = el.closest('.demo');
      if (!demo) return;
      const name = el.getAttribute('data-toggle');
      if (name === 'route-corner') {
        const card = demo.querySelector('.route-card');
        if (card) card.setAttribute('data-hide-corner', el.checked ? '0' : '1');
      }
    });
  });

  // Flow connector replay
  const flowReplay = document.getElementById('flow-replay');
  const flowSvg = document.getElementById('flow-svg');
  if (flowReplay && flowSvg) {
    flowReplay.addEventListener('click', function () {
      flowSvg.classList.remove('replay');
      // force reflow then restart
      void flowSvg.offsetWidth;
      flowSvg.classList.add('replay');
    });
  }

  // Motion previews
  function replay(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('play');
    void el.offsetWidth;
    el.classList.add('play');
  }
  document.querySelectorAll('[data-replay]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const id = btn.getAttribute('data-replay');
      if (id === 'motion-typed') {
        typewriter();
      } else {
        replay(id);
      }
    });
  });

  // Typewriter motion preview
  const typed = document.getElementById('motion-typed');
  const phrases = ['build with motion', 'ship the spec', 'design that runs'];
  let phraseIdx = 0;
  function typewriter() {
    if (!typed) return;
    const phrase = phrases[phraseIdx % phrases.length];
    phraseIdx++;
    typed.textContent = '';
    let i = 0;
    const tick = function () {
      if (i <= phrase.length) {
        typed.textContent = phrase.slice(0, i);
        i++;
        setTimeout(tick, 60);
      }
    };
    tick();
  }
  typewriter();

  // Initial motion replays
  replay('motion-build-in');
  replay('m-edge');
  setInterval(function () { replay('motion-build-in'); }, 4000);
  setInterval(function () { replay('m-edge'); }, 3500);

  // TOC toggle on mobile
  const toc = document.getElementById('ds-toc');
  const tocToggle = document.getElementById('ds-toc-toggle');
  if (toc && tocToggle) {
    tocToggle.addEventListener('click', function () {
      toc.classList.toggle('open');
    });
  }
})();
