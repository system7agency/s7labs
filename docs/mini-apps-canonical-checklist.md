# Mini-app canonical checklist (the "website-roast treatment")

Apply this to EVERY mini-app so all 23 look and behave identically. website-roast
is the reference implementation — open it side by side when in doubt.

The shared layer is already built; most of this is deleting per-app overrides and
adjusting each app's footer JSX. Do NOT re-invent styles — make the app USE the
shared canonical classes.

## 1. Root scope
- The app's outermost `<div>` (wrapping `<AuroraBackground/>`/Header/Footer)
  carries `mini-app-scope` in its className. (Most apps already do.)

## 2. Tokens — no per-app redeclaration
- In `page-styles.css`, the opening `.<scope> { … }` block must NOT redeclare
  design tokens (`--bg`, `--text`, `--border`, `--text-muted`, etc.). They come
  from the canonical `.mini-app-scope` layer. Keep only real layout props
  (background, color, font-family, min-height…). App-specific tokens that have a
  canonical alias (`--surface`, `--danger`, `--good/--warn/--bad`, `--accent`)
  should be deleted too.

## 3. Buttons — pill, from shared CSS
- Delete the app's own `.submit-btn` / `.<prefix>-submit-btn` rule from
  `page-styles.css` (keep only app-specific bits like `svg { width }`). The
  canonical `.submit-btn` (pill 999px, gradient, hover, disabled, focus) wins.
- Rename any prefixed submit class in BOTH page.tsx and page-styles.css to the
  canonical `.submit-btn` (e.g. `.pd-submit-btn`/`.ef-submit-btn`/`.fp-submit-btn`
  → `submit-btn`).
- Delete the app's own `.export-btn` rule (canonical pill export chip wins).

## 4. Inputs — glassy fill, canonical box, SANS text (STRICT)
- Delete ALL per-app cosmetic input CSS so fields are byte-identical across
  apps. Specifically remove the app's own:
  - `.input-field` / `.textarea-field` (gap, margin) — canonical owns rhythm
    (label→input 8px, field→field 20px).
  - `.input-field label` / `.textarea-field label` — canonical owns the label
    (mono 11px, 0.16em, `--text-dim`). Do NOT set `--text-faint` / 10px / custom.
  - `.input-box` / `.textarea-box` fill, border, radius, focus, error.
  - `.input-box input` / `textarea` font, size, padding, color — canonical is
    SANS `--sans`, `--ma-text-base`, `padding: 0`. NEVER set the inner input to
    `var(--mono)` or a custom font/padding.
  - Any `.prompt` glyph rule (terminal `$`/icon prefixes are removed per guide).
  - Any orphaned per-app shake keyframe.
- KEEP ONLY genuinely structural needs that the shared class can't express:
  - a textarea `min-height` (e.g. 160–220px),
  - a combined input+inline-submit "search bar" layout (e.g. email-finder),
  - autofill override is already canonical — delete per-app copies.
- After stripping, the idle form's fields must look identical to
  website-roast / agentic-readiness (the reference pair).
- **Remove inline `style={{ marginTop: N }}` on form fields.** Many apps put
  `style={{ marginTop: 14 }}` on the email `.input-field` (the guide's old
  email-gate snippet). This STACKS on the canonical `.input-field`
  `margin-bottom: 20px`, producing a ~34px gap. Delete it — the canonical field
  rhythm owns the spacing. The `InlineConsentField` already has `margin-top: 0`.
  Keep the `submit-row` `marginTop` (that's a deliberate gap before the CTA).
- VERIFY SPACING WITH THE BOX MODEL, not by reading CSS: a CSS grep misses
  inline React styles. Screenshot the full idle form and check the URL→email and
  email→consent gaps are equal.

## 4b. Export capture ref must wrap the WHOLE report (not just part)
- The `resultRef` passed to `<ExportControls>` must wrap EVERY visible result
  section, including any gated / lazily-loaded / multi-block content (e.g.
  agentic-readiness's `<GatedBreakdown>`, share-of-voice / ai-overview-tracker
  gated breakdowns). A common bug: the ref wraps only the free teaser, so the
  PNG/PDF exports a partial, single-screen report and the detailed data is lost.
- Put the ref `<div>` around the full result body; the multi-page PDF slicer
  then paginates tall reports automatically (verify the PDF has >1 page when the
  content is long).

## 5. Result footer — centered .result-actions, NO token line
- Replace the app's result-footer block with the canonical pattern:
  ```tsx
  <div className="result-actions">
    <ExportControls
      resultRef={resultPanelRef}
      slug="<slug>"
      appName="<Display Name>"
      filename={`<slug>-${slugifiedSubject}`}
      subject={<subject or omit>}
      plainText={build<App>PlainText(result)}
    />
    <button className="run-again" type="button" onClick={handleReset}>
      <App's reset label> <svg.../>   {/* keep the app's arrow icon */}
    </button>
  </div>
  ```
- DELETE the token-debug line (`{tokens ? `… tokens · … in / … out` : ''}`) and
  its `.token-pill` span. Remove the now-dead `tokens`/`resultTs`/`fmtTs`
  state + setter + helper if nothing else reads them (the top-bar `SYS·ENG·LAT·TS`
  readout, if present, is a DIFFERENT thing — leave it).
- If the app had a separate `.result-ts` timestamp in the footer, drop it.
- If the app has NO export (copy-only or none), still center any reset action in
  `.result-actions`.

## 6. Loading state — instant feedback
- In `handleSubmit`, set the loading state IMMEDIATELY after client validation
  passes (`setSysState('running'); setAppState('loading'); startLoadingAnimation(…)`)
  and run the `/api/leads/submit` fetch AFTER that. On lead-save failure or
  network error, REVERT to idle (`clearTimers(); setSysState('idle');
  setAppState('idle');`) and show the email error. This removes the dead time
  where nothing happens while the lead saves.
  (Reference: website-roast handleSubmit.)

## 7. Hard constraints (don't break CI)
- Keep inline in page.tsx: the `EMAIL_REGEX` import, the `'/api/leads/submit'`
  string, and `miniAppSlug: '<slug>'`.
- Don't change the model route, the result component body, or any email-unlock
  flow.
- Export ref must still wrap the same result DOM node.

## 8. Verify (per app)
- `npm run typecheck` clean; `npm run lint` 0 errors (the tech-stack-finder
  `<img>` warning is pre-existing/acceptable).
- If the app is in `e2e/mini-apps.spec.ts`, run
  `npx playwright test e2e/mini-apps.spec.ts -g "<slug>" --reporter=line` (pass).
  If not in the spec, confirm the dev route returns 200 and screenshot the
  idle form + result footer.
- grep page.tsx: no leftover `html2canvas`/`jspdf`/`handleDownloadPng`/
  `exportState`/`token-pill`/`tokens ·`.

## Shared things already done (all apps inherit — do NOT redo per app)
- html-to-image branded PNG/PDF export util + `<ExportControls>`.
- Canonical pill `.submit-btn` / `.export-btn`, glassy `.input-box`, `.result-actions`.
- `<HowItWorks>` refinement (solid-blue accent, readable text, 56px top gap).
- Removed "WE'LL SEND YOUR RESULT EITHER WAY" consent line.
