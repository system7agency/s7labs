# Mini-apps canonical component spec

ONE spec all 23 mini-apps follow so they read as a single product. Values
chosen to match the **System7 brand language** already in the landing page,
`Header`/`Footer`, and the RevOps lab page: pill buttons (`border-radius: 999px`),
glassy surface cards (10–14px), mono uppercase micro-labels. Dark OLED
glassmorphism on the existing palette.

This is the reference. It gets encoded into `src/styles/mini-app-ui.css`
(class definitions) on top of the `--ma-*` tokens already in
`src/styles/mini-app-tokens.css`. Per-app `page-styles.css` should then only
hold app-_specific_ result content, never re-declare these.

> Source of truth for values: brand uses `border-radius: 999px` for all
> buttons/CTAs/chips and `10px`/`14px` for surfaces (verified in
> `docs/design-reference/landing-page.html`, `revops-lab-page.html`,
> `Header.css`). The mini-apps had drifted to 8px / 2px rectangles — this spec
> pulls them back to the brand.

---

## 1. Palette (unchanged — already canonical)

| token                          | value                         | use                            |
| ------------------------------ | ----------------------------- | ------------------------------ |
| `--ma-bg`                      | `#060608`                     | page background (under aurora) |
| `--ma-surface-1`               | `#101014`                     | panel / card fill              |
| `--ma-surface-2`               | `#16161b`                     | nested card / input fill       |
| `--ma-border`                  | `rgba(255,255,255,.07)`       | hairline borders               |
| `--ma-border-strong`           | `rgba(255,255,255,.14)`       | input / button borders         |
| `--ma-text`                    | `#f2f3f5`                     | primary text (AA on bg)        |
| `--ma-text-dim`                | `#9395a0`                     | body / secondary               |
| `--ma-text-muted`              | `#5e6068`                     | labels / meta                  |
| `--ma-blue`                    | `#4f8cff`                     | primary accent / CTA           |
| `--ma-cyan`                    | `#04e3ee`                     | eyebrow dot / highlights       |
| `--ma-error/-warning/-success` | `#ff5c7a / #f5a623 / #4fcf8a` | status                         |

## 2. Spacing scale (4px base) — use tokens, never ad-hoc px

`--ma-space-1..16` = 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64.
Vertical rhythm tiers: **field gap 14px, group gap 24px, section gap 48px.**

## 3. Radius scale (brand: pills + soft cards)

| token              | value   | applies to                                     |
| ------------------ | ------- | ---------------------------------------------- |
| `--ma-radius-sm`   | `8px`   | export chips, small tags, nested cells         |
| `--ma-radius-md`   | `10px`  | input box, textarea box, secondary buttons     |
| `--ma-radius-lg`   | `14px`  | **outer panel / result cards**                 |
| `--ma-radius-pill` | `999px` | **primary submit button, status pills, chips** |

The single biggest unifier: **primary CTA = pill (999px)** everywhere (matches
the brand). Stop using 8px/2px rectangles for the submit button.

## 4. Typography

| role                      | size                     | weight | font     | notes                                                                        |
| ------------------------- | ------------------------ | ------ | -------- | ---------------------------------------------------------------------------- |
| Hero h1                   | `clamp(34px, 6vw, 58px)` | 600    | sans     | one canonical clamp for ALL apps                                             |
| Section h2                | `38px`                   | 600    | sans     | e.g. "How it works"                                                          |
| Card title                | `16px`                   | 600    | sans     |                                                                              |
| Body                      | `14px`                   | 400    | sans     | line-height 1.55                                                             |
| Small / meta              | `13px`                   | 400    | sans     | line-height 1.5                                                              |
| **Micro-label / eyebrow** | `11px`                   | 500    | **mono** | `text-transform: uppercase; letter-spacing: .12em; color: var(--text-muted)` |

Eyebrow chip = mono 11px uppercase with a leading **cyan dot**, pill border.

## 5. Outer panel (the card every app sits in)

```
.panel  — background: linear-gradient(180deg, rgba(255,255,255,.02), transparent), var(--surface-1);
          border: 1px solid var(--border);
          border-radius: var(--ma-radius-lg);   /* 14px */
          backdrop-filter: blur(12px);
          padding: 28px;                          /* desktop; 20px @ <640px */
.panel-wrap — width: min(100%, var(--ma-width-narrow));  /* 680px canonical */
.corner.tl/.tr/.bl/.br — 14px L-shaped cyan-tinted accent marks
```

## 6. Labels (identical everywhere)

```
.input-field > label, .textarea-field > label
  font: 500 11px var(--mono); text-transform: uppercase; letter-spacing: .12em;
  color: var(--text-muted); margin-bottom: 8px; display: block;
  required asterisk: <span style="color:var(--error)"> *</span>
```

## 7. Input field (one canonical box)

```
.input-box
  border: 1px solid var(--border-strong);
  border-radius: var(--ma-radius-md);     /* 10px — single value, kill the 4 variants */
  background: rgba(255,255,255,.025);
  padding: 14px 16px;                       /* single value; min-height 48px tap target */
  transition: border-color .2s, box-shadow .2s, background .2s;
.input-box:focus-within
  border-color: rgba(79,140,255,.55);
  box-shadow: 0 0 0 3px rgba(79,140,255,.12);
  background: rgba(79,140,255,.03);
.input-box.error  border-color: var(--error); + ma-shake 0.35s (reduced-motion: none)
.input-box input/textarea  transparent, no border, color var(--text), placeholder var(--text-faint)
.textarea-box  same, min-height 160px, vertical resize
+ :-webkit-autofill override (dark-theme)
```

## 8. Buttons (one hierarchy, brand-aligned)

| class                        | shape          | padding                     | fill                                      | text      |
| ---------------------------- | -------------- | --------------------------- | ----------------------------------------- | --------- |
| `.submit-btn` (primary CTA)  | **pill 999px** | `13px 26px` (min-height 48) | `linear-gradient(180deg,#5a96ff,#4f8cff)` | #fff, 600 |
| `.btn-secondary`             | 10px           | `11px 18px`                 | `rgba(255,255,255,.025)` + border-strong  | text      |
| `.btn-ghost`                 | 10px           | `10px 14px`                 | transparent→hover tint                    | text-dim  |
| `.export-btn` (Copy/PNG/PDF) | **pill 999px** | `8px 14px`                  | `rgba(255,255,255,.025)` + border         | mono 11px |
| `.btn-small`                 | pill 999px     | `7px 12px`                  | as ghost                                  | mono 11px |

States (all buttons): hover `translateY(-1px)` + blue glow (reduced-motion: no
transform); `:focus-visible` 2px blue ring; `:disabled`/`[aria-disabled]`
opacity .5 + not-allowed, no transform. **One primary CTA per screen.**

## 9. Result blocks

- `.score-row` — `grid; repeat(auto-fit, minmax(0,1fr)); gap 12px`
- `.score-card` — pad `16px 14px`, radius `10px`, 1px border, 2px left accent;
  `.good/.mid/.bad` color the accent + value; `.score-label` mono 11px muted,
  `.score-value` 32px/600.
- `.summary-block` — 2px blue left rule, pad-left 16px, text-dim, lh 1.55.
- `.issue-card` — pad `14px 16px`, radius `10px`, border; `.issue-badge`
  severity pill (`.critical/.warning/.suggestion`) with a **text label** (never
  color-only); `.issue-fix` success-tinted bg.
- `.result-footer` — flex, border-top 1px, pad-top 16px, gap 8px, holds
  `<ExportControls>` (pill chips).

## 10. "How it works" — ONE shared layout (already a shared component)

`<HowItWorks>` (`src/components/mini-apps/HowItWorks.tsx` + `HowItWorks.css`)
is the single source. Canonical shape — every app passes 4 steps, no per-app
overrides:

```
section margin-top: 96px (desktop) / 64px (mobile)
.hiw-eyebrow  mono 11px uppercase, cyan, pill border, leading cyan dot
.hiw-head h2  38px / 600, centered, max-width ~640px
.hiw-step     grid-template-columns: 1fr 56px 1fr; margin-bottom 28px
              (alternating left/right; the 56px center rail holds the step node)
.hiw-card     padding 22px 24px; radius 14px; 1px border; surface-1 fill;
              title 16px/600; body 14px/1.55 text-dim; LEFT-aligned both sides
.hiw-node     step number in a 56px circle, blue ring, mono
reveal        IntersectionObserver fade-up, stagger 120ms/step (reduced-motion: none)
breakpoint    <640px → single column, node rail collapses, steps stack
```

Rule: apps **must** render `<HowItWorks steps={…4…} />` — never inline their own
"how it works" markup, never add per-app margin/align overrides.

## 11. Accessibility (baked into the shared classes)

- Every interactive element: visible `:focus-visible` ring (2px blue).
- Inputs: real `<label for>`, `aria-invalid`, error in `role="alert"` below field.
- Severity/status: color **plus** text/icon, never color alone.
- `prefers-reduced-motion: reduce` disables shake, hover-translate, reveal.
- Tap targets ≥ 44px; touch gaps ≥ 8px.
- Disabled: opacity .5 + `cursor: not-allowed` + `aria-disabled`.

---

### What changes per app when this is enforced

1. Submit button: 8px/2px rectangle → **999px pill**.
2. Input box: 4 padding variants → **single `14px 16px`, radius 10px**.
3. Export chips: → **pill, mono 11px**.
4. Prefixed classes (`.pd-submit-btn`, `.ef-submit-btn`, `.fp-submit-btn`) →
   renamed to canonical `.submit-btn`.
5. Per-app `.submit-btn/.input-box/.export-btn` rules in `page-styles.css`:
   **deleted** so the shared class wins.
6. "How it works": any inline variant → shared `<HowItWorks>`.
