# Mini-apps developer guide

How to build a new mini-app on s7labs.ai so it looks right, captures
leads, survives CI, and doesn't reintroduce any of the bugs we've spent
time fixing.

This is the long-form sibling of [`mini-apps.md`](./mini-apps.md) (which
just lists the bare CI-enforced rules). Read this first when you're
starting a new app. Skim it once if you're touching an existing one.

The reference port is always
[`src/app/mini-apps/pricing-diagnostic/`](../src/app/mini-apps/pricing-diagnostic/).
When in doubt, open that next to your tab and copy the shape.

---

## What a mini-app is

A self-contained, single-page tool inside the marketplace at `/mini-apps`.
Visitor lands on `/mini-apps/<slug>`, fills a form, gets an AI-generated
result. We capture their work email up front so the lead lands in
Supabase before we spend a single Anthropic token.

Everything else flows from that: the visual chrome, the state machine,
the result panel, the export controls — all standardised so the gallery
feels like one product, not 15.

---

## File layout

```
src/app/mini-apps/<your-slug>/
  page.tsx           # entry, default export, all the JSX
  page-styles.css    # co-located styles, scoped under .<your-slug>
  PageScripts.tsx    # tiny client-only side-effects shell (often empty now)
```

The folder name **doesn't have to match the Supabase slug** — match them
when you can for grep-ability, but several live apps already diverge
(`outbound-radar` → `outbound-trigger-radar`, `crm-sanity` →
`crm-field-sanity-check`, etc.). The folder name is what shows up in the
URL; the slug is what the CI check + DB use.

### Where to put things

| Thing                               | Where                                                |
| ----------------------------------- | ---------------------------------------------------- |
| Marketplace card metadata           | `src/app/mini-apps/_data/apps.ts`                    |
| The page itself                     | `src/app/mini-apps/<folder>/page.tsx`                |
| The model route                     | `src/app/api/mini-apps/<route>/route.ts`             |
| Shared types between page and route | top of the route file, re-export to the page         |
| Shared LLM helpers                  | `src/lib/llm/` (cost, style system prompt)           |
| Shared lead helpers                 | `src/lib/leads/` (disposable list, free providers)   |
| App-specific styles                 | co-located `page-styles.css`, scoped under `.<slug>` |
| Shared visual components            | `src/components/mini-apps/`                          |

---

## The state machine

Every app has the same four states. Drive them off a single union:

```tsx
type AppState = 'idle' | 'loading' | 'result' | 'error'
const [appState, setAppState] = useState<AppState>('idle')
```

The page renders four `<section>` blocks, one per state, gated by
`appState`. **Never** use a template-literal className like
`` `<prefix>-state${appState === 'idle' ? 'active' : ''}` `` —
prettier-tailwindcss strips the leading space inside the ternary and you
end up with `<prefix>-stateactive` as a single fused class, which never
matches the `.<prefix>-state.active` rule. Use `clsx`:

```tsx
<section className={clsx('pd-state', { active: appState === 'idle' })}>…</section>
<section className={clsx('pd-state', { active: appState === 'loading' })}>…</section>
<section className={clsx('pd-state', { active: appState === 'result' })}>…</section>
<section className={clsx('pd-state', 'error-state', { active: appState === 'error' })}>…</section>
```

CSS side:

```css
.<slug > .<prefix > -state {
  display: none;
}
.<slug > .<prefix > -state.active {
  display: block;
}
```

**This bug class (the "CC-1 cousin") shows up everywhere people use
conditional template-literal classNames.** Always reach for `clsx` for
conditional classes. If you find yourself writing
`` `something${flag ? 'mod' : ''}` `` , stop and rewrite as
`clsx('something', { mod: flag })`. We've fixed ~30+ of these so far —
every one of them was silently breaking a hover state, a "best"
highlight, a copied confirmation, or a loading-stage indicator.

---

## The inline email gate (a.k.a. CC-2)

The visitor's email is captured **before** the model call, not after.
Reasons:

1. A visitor who bails at an "after-result" gate has cost us tokens
   with no lead to show for it.
2. We want disposable / free-provider emails rejected server-side
   before any model spend.

The pattern:

### Form

A `Work email *` field sits inline with the rest of the app's inputs
(no overlay component, no modal). Use the established `.input-box`
wrapper + the established label style:

```tsx
<div className="input-field" style={{ marginTop: 14 }}>
  <label>
    Work email <span style={{ color: 'var(--error, #ff5c7a)' }}>*</span>
  </label>
  <div key={`e-${shakeEmail}`} className={clsx('input-box', { error: emailError })}>
    <input
      type="email"
      inputMode="email"
      autoComplete="email"
      placeholder="you@company.com"
      value={email}
      disabled={submitting}
      onChange={(e) => {
        setEmail(e.target.value)
        if (emailError) setEmailError(null)
      }}
    />
  </div>
  {emailError && <div className="field-error">{emailError}</div>}
</div>
```

### handleSubmit

```tsx
const handleSubmit = useCallback(
  async (e: FormEvent) => {
    e.preventDefault()
    if (submitting) return

    // 1. Local validation (BOTH input and email, single `valid` flag)
    let valid = true
    if (!input.trim()) {
      setInputError('…')
      setShakeInput((k) => k + 1)
      valid = false
    }
    const emailClean = email.trim().toLowerCase()
    if (!emailClean) {
      setEmailError('Please enter your work email.')
      setShakeEmail((k) => k + 1)
      valid = false
    } else if (!EMAIL_REGEX.test(emailClean)) {
      setEmailError('Please enter a valid email.')
      setShakeEmail((k) => k + 1)
      valid = false
    }
    if (!valid) return

    setInputError(null)
    setEmailError(null)
    setSubmitting(true)
    setResult(null)
    setErrorMsg('')

    // 2. Save lead FIRST — server enforces disposable + free-provider blocks
    let submissionId: string | null = null
    try {
      const res = await fetch('/api/leads/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: emailClean,
          miniAppSlug: 'your-slug', // must match an active mini_apps row
          input: {
            /* what the user submitted */
          },
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok || !json.submissionId) {
        setEmailError(json.error || "Couldn't save your info. Try again.")
        setShakeEmail((k) => k + 1)
        setSubmitting(false)
        return
      }
      submissionId = json.submissionId
    } catch {
      setEmailError("Couldn't save your info. Try again.")
      setShakeEmail((k) => k + 1)
      setSubmitting(false)
      return
    }

    // 3. Switch to loading + fire the model
    setSysState('running')
    setAppState('loading')
    startLoadingAnimation(/* label */)

    let data: ApiResponse
    try {
      const res = await fetch('/api/mini-apps/<route>', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          /* model input */
        }),
      })
      data = (await res.json()) as ApiResponse
    } catch {
      clearTimers()
      setErrorMsg('Network error. Please check your connection and try again.')
      setSysState('error')
      setAppState('error')
      setSubmitting(false)
      return
    }

    clearTimers()
    /* finish the loading animation, fill latency / progress */

    if (data.ok) {
      setResult(data.data)
      setTokens(/*…*/)
      setSysState('complete')
      setAppState('result')

      // 4. Fire-and-forget completion ping
      fetch('/api/leads/complete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          output: data.data,
          ...(data.cost ? { cost: data.cost } : {}),
        }),
      }).catch((err) => console.error('[your-slug] leads/complete', err))
    } else {
      setErrorMsg(data.message)
      setSysState('error')
      setAppState('error')
    }
    setSubmitting(false)
  },
  [input, email, submitting, startLoadingAnimation, clearTimers]
)
```

Notes:

- `EMAIL_REGEX` lives in `@/lib/leads/disposable`. The server uses the
  same regex + a disposable-domain list + a 40+ free-provider list
  (gmail/yahoo/outlook/etc.) so client and server agree on what's
  acceptable.
- The CI check enforces the inline pattern: it grep-checks the page for
  the `EMAIL_REGEX` import AND the literal `/api/leads/submit` string,
  and pulls the slug from `miniAppSlug: '<slug>'`.
- The old `<EmailGate>` overlay component still exists for historical
  reasons but is **no longer the convention**. Don't introduce new uses.

---

## Visual design language

Always look at `pricing-diagnostic` first. The chrome is:

1. **Background** — shared `<AuroraBackground />` canvas (don't inline
   your own `bg-layer` divs with `@keyframes drift*`; we ripped those out
   of four apps).
2. **Hero** — eyebrow chip (mono uppercase with a leading cyan dot), h1
   with a `.accent` span for the second clause (plain blue, no italic,
   no gradient-clip — that treatment was simplified across all 15 apps),
   subtitle paragraph, optional info-strip chips.
3. **Panel** — dark glassy panel with corner accents
   (`.corner.tl/.tr/.bl/.br`), backdrop blur, gradient border. A
   `.panel-readouts` bar at the top shows `SYS · ENG · LAT · TS` when
   not in idle state.
4. **Idle form** — `.input-field` / `.input-box` / `.textarea-field` /
   `.textarea-box` pattern. Focus-within glows blue, error shakes.
5. **Loading state** — progress bar + 4-stage cards (`.stage` with
   `.stage-num-row`, `.stage-title`, `.stage-log`) that light up in
   sequence.
6. **Result state** — `.result-head` with title + timestamp label, then
   the app's specific result content, then `.result-footer` with export
   buttons.
7. **Error state** — `.err-icon` + `.err-title` + `.err-message` +
   "Try again" button.
8. **HowItWorks** rail — shared `<HowItWorks>` component (4 steps),
   below the panel.
9. **Header + Footer** — shared `<Header />` and `<Footer />`. Never
   inline your own.

### Design tokens

Every app's `page-styles.css` starts with the same token block, scoped
under the app's class:

```css
.<slug > {
  --bg: #060608;
  --surface-1: #101014;
  --surface-2: #16161b;
  --border: rgba(255, 255, 255, 0.07);
  --border-strong: rgba(255, 255, 255, 0.14);
  --text: #f2f3f5;
  --text-dim: #9395a0;
  --text-muted: #5e6068;
  --text-faint: #3a3b42;
  --blue: #4f8cff;
  --cyan: #04e3ee;
  --error: #ff5c7a;
  --warning: #f5a623;
  --success: #4fcf8a;
  --mono: var(--font-mono), 'Geist Mono', ui-monospace, …;
  --sans: var(--font-sans), 'Geist', ui-sans-serif, …;
}
```

Use these tokens, don't hard-code colours. If you need a new colour,
consider whether the whole system should add it.

### Things we explicitly DO NOT do anymore

- **Em dashes (`—`) in user-facing prose.** Period or comma instead. The
  standalone `'—'` glyph as a "no data" placeholder is fine (latency
  readouts, empty cells), prose isn't.
- **Italic + gradient-clip on the hero `.accent`.** Solid blue only.
- **Throwaway terminal prompt glyphs** (`<span className="prompt">$</span>`)
  in front of inputs/textareas. They confuse non-technical users.
- **The `tokens · X in / Y out` + `· UTC` dev-debug result footer.**
  Internal noise. Keep the export buttons.
- **Native `<select>` elements.** Browser-default chrome breaks the
  theme on the open menu (the OS controls it). Build a small custom
  dropdown instead — see `ai-overview-tracker/page.tsx` `MarketDropdown`
  for the reference shape.
- **Inline aurora backgrounds.** Use the shared component.
- **Inline info-strip with `.dim-card`s.** Use the shared `<HowItWorks>`.
- **`text-align: right` on left-side HowItWorks cards.** Hard to read.

### Browser autofill

Chrome / Edge overrides input backgrounds when autofilling. Every app
needs the autofill override scoped under its class:

```css
.<slug > .input-box input:-webkit-autofill,
.<slug > .input-box input:-webkit-autofill:hover,
.<slug > .input-box input:-webkit-autofill:focus {
  -webkit-text-fill-color: var(--text);
  -webkit-box-shadow: 0 0 0 1000px var(--bg) inset;
  caret-color: var(--text);
  transition: background-color 9999s ease-in-out 0s;
}
```

---

## The model route

```
src/app/api/mini-apps/<route>/route.ts
```

Convention:

- `export const dynamic = 'force-dynamic'`
- `export const runtime = 'nodejs'`
- Validate the request body with zod
- Use `STYLE_SYSTEM_PROMPT` from `@/lib/llm/style` as the system prompt
- Call `calculateCost(usageFromAnthropic(response))` from
  `@/lib/llm/cost` and return the breakdown so the client can forward
  it to `/api/leads/complete`
- Return `{ ok: true, data, cost }` on success or `{ ok: false, message }`
  on failure. Pick a sane status code (422 for input errors, 502 for
  upstream service issues, etc.)
- If the route depends on an external API (Anthropic plus DataForSEO,
  Apollo, etc.), check ALL env vars at the top and return a clear
  `Service not configured` 502 if any are missing — but also see the
  "Killswitch" section below.

### Input size cap

If the route takes free-text (CRM record, brief, paste), put a hard
upper cap on input size. We've been bitten by silent server-side
truncation. Cap at something sensible for one record / one brief
(e.g. `crm-sanity` caps at 4000 chars), reject above with a clear 413.
Set `<textarea maxLength={CAP}>` on the client so the browser physically
blocks more, plus a char-counter that turns amber at 80% and red at
100%.

---

## DB registration

Every active mini-app needs a row in `mini_apps`:

```sql
insert into mini_apps (slug, name, description, category, status)
values (
  'your-slug',
  'Your App Display Name',
  'Short tagline.',
  'diagnostic',  -- diagnostic | finder | enrichment | linkedin | email | strategy | visibility | benchmark | other
  'active'
);
```

If the slug isn't in the table, `/api/leads/submit` returns
`Unknown mini-app` and CI blocks the PR. Register it via Supabase MCP
or the SQL editor.

---

## Killswitch pattern (for apps depending on un-provisioned external APIs)

When your app needs an external API key that isn't always available
(Apollo, DataForSEO, etc.), don't let users hit a 502 mid-submit.
Add a client-side killswitch:

```tsx
const APP_ENABLED = (process.env.NEXT_PUBLIC_YOUR_APP_ENABLED ?? 'false') === 'true'

// At the top of handleSubmit, after `if (submitting) return`:
if (!APP_ENABLED) return
```

And in the JSX, replace the submit button with a clearly-disabled
"Coming soon" version + an amber notice above it:

```tsx
{!APP_ENABLED ? (
  <div className="<prefix>-coming-soon" role="status">
    <span className="<prefix>-coming-soon-dot" />
    Coming soon. <X> access in review. Form is read-only for now.
  </div>
) : null}
<div className="submit-row" style={{ marginTop: APP_ENABLED ? 18 : 14 }}>
  <button
    type="submit"
    className="submit-btn"
    disabled={submitting || !APP_ENABLED}
    aria-disabled={submitting || !APP_ENABLED}
  >
    {APP_ENABLED ? 'Run it' : 'Coming soon'}
  </button>
</div>
```

Reference: `email-finder`, `find-people`, `ai-overview-tracker`.

When the key lands, set the env var to `true` in `.env.local`,
restart dev, the app activates without code changes.

---

## Shared components

Don't inline replacements for these:

| Component                                | Where to find it                                                    |
| ---------------------------------------- | ------------------------------------------------------------------- |
| `<Header />` + `<Footer />`              | `src/components/`                                                   |
| `<AuroraBackground />`                   | `src/components/mini-apps/AuroraBackground.tsx`                     |
| `<HowItWorks />` + `HowItWorksStep` type | `src/components/mini-apps/HowItWorks.tsx`                           |
| `<BackToMiniAppsPill />`                 | `src/components/mini-apps/` (rendered globally by mini-apps layout) |

`<EmailGate />` and `<SubmitOnce />` still exist for the old pattern but
are not the convention anymore — don't use in new code.

---

## Result panel patterns

The result panel has a few common building blocks. Reach for these
before inventing new ones:

- **Score row** — 2–3 horizontal "score-card" tiles for headline
  metrics (e.g. pricing-diagnostic's Friction Score / Clarity Grade /
  Plan Legibility). Each card has a label, value, and a 1-line delta
  description. Colour-code by severity (good / mid / bad CSS classes).
- **Summary block** — left-rule + 2–3 sentence prose summary.
- **Cleaned record block** — for apps that take user input and return a
  cleaned/transformed version (e.g. crm-sanity). Renders the full
  output in the user's input format with a copy-to-clipboard button.
  See `CleanedRecordBlock` in crm-sanity.
- **Issues / improvements list** — numbered cards with severity badges,
  one-line title, longer description, fix suggestion.
- **Export controls** — Copy / PNG / PDF buttons in `.result-footer`.
  Use the established `.export-btn` pattern with `clsx` for loading
  states. Don't add the token-pill or timestamp metadata.

For exports, the standard recipe uses `html2canvas` + `jspdf` (both
already installed). Render the result inside a `<div ref={resultPanelRef}>`
and pass that ref to the canvas helpers.

---

## How long should the loading animation be?

`STAGE_MS = 4000` to `5000` per stage × 4 stages = 16–20s of total
animation budget. Real Anthropic calls usually come back in 5–12s — the
animation finishes early (we set all stages to done + jump to result),
or runs to 98% and waits.

Tune `STAGE_MS` so the animation feels neither racy nor slow. The
4-stage shape is non-negotiable for visual consistency.

---

## Common antipatterns and what to do instead

| Antipattern                                                            | Why it's bad                                                      | Do this instead                                                       |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------- |
| `` `<base>${flag ? 'mod' : ''}` ``                                     | Prettier strips space, fused class, silent rendering bug.         | `clsx('<base>', { mod: flag })`                                       |
| `<select>` for an options picker                                       | OS controls the open menu, breaks the theme.                      | Custom button + popover (see `MarketDropdown` in ai-overview-tracker) |
| `<EmailGate>` overlay around the result                                | Pays Anthropic before the email is captured.                      | Inline email field + lead-save before the model call.                 |
| `recordText.slice(0, 6000)` server-side                                | Silent truncation, user has no idea half their input was ignored. | Explicit 413 + client-side maxLength + char counter.                  |
| `<span className="prompt">$</span>` before a real form input           | Looks like a terminal, confuses non-technical users.              | Just a label + a placeholder.                                         |
| Em dash in user-facing prose                                           | Reads like an LLM tell, distracting.                              | Period, comma, "and".                                                 |
| `useState('—')` placeholder + try to "fix" it during the em-dash sweep | That `'—'` is a glyph for "no data" — don't replace it.           | Leave standalone `'—'` placeholders alone.                            |
| Inline `bg-layer` / `bg-aurora` divs                                   | Inconsistent with the rest of the gallery.                        | `<AuroraBackground />`                                                |
| Inline `info-strip` with `.dim-card`s                                  | Same.                                                             | `<HowItWorks steps={…} />`                                            |
| Token-count + timestamp footer in the result                           | Dev-debug data leaking to end users.                              | Drop it. Keep export buttons.                                         |
| `text-align: right` on left-side timeline cards                        | Body text wraps with uneven left edge, hard to read.              | Left-align both sides; rely on card position for visual rhythm.       |
| Native `<input type="email">` without `:-webkit-autofill` override     | Chrome turns it white-on-blue, breaks the dark theme.             | Add the autofill override per app.                                    |

---

## Running things locally

```bash
npm run dev               # local dev
npm run typecheck         # tsc --noEmit
npm run lint              # eslint
npm run e2e               # Playwright suite (59 tests, mocks Anthropic, costs $0)
npm run e2e:ui            # Playwright UI mode

# Run the mini-app convention check locally (loads env from .env.local)
set -a; source .env.local; set +a
node scripts/check-mini-apps.mjs
```

---

## Adding a new mini-app — the speedrun

1. Pick a slug. Add a row to `mini_apps` in Supabase via MCP or SQL
   editor.
2. Add a card to `src/app/mini-apps/_data/apps.ts` with metadata.
3. Copy `src/app/mini-apps/pricing-diagnostic/` to
   `src/app/mini-apps/<your-slug>/`. Rename the scope class throughout
   the CSS file from `.pricing-diag` to `.<your-slug>`.
4. Create `src/app/api/mini-apps/<route>/route.ts`. Copy the
   pricing-diagnostic route structure (zod schema, anthropic call with
   `STYLE_SYSTEM_PROMPT`, JSON parse, cost calc, response shape).
5. Replace the input form with whatever your app needs. Keep the
   `.input-field` / `.input-box` patterns. Add the Work email field.
6. Rewrite `handleSubmit` to do `/api/leads/submit` → model → `/api/leads/complete`.
7. Define your `STAGES` array (4 of them, with `num`, `title`, `logs`).
8. Replace the result panel JSX with what your app actually renders.
9. Define `HOW_IT_WORKS_STEPS` (4 entries) and pass to `<HowItWorks>`.
10. Run `npm run typecheck && npm run lint && node scripts/check-mini-apps.mjs`.
    Fix anything red.
11. Run `npm run dev` and walk through the 7-section QA checklist in
    [`docs/qa-report-2026-06-05.md`](./qa-report-2026-06-05.md) (use the
    pricing-diagnostic entry as your template).

---

## When you're stuck

- Open `src/app/mini-apps/pricing-diagnostic/page.tsx` in another tab.
  That's the gold standard. If your file diverges materially, ask why.
- If a class isn't applying, grep for `` `${ `` patterns in your file
  — it's almost always a CC-1-cousin template-literal bug.
- If autofill is white-on-blue, the `:-webkit-autofill` override is
  missing.
- If the dropdown looks like OS-default chrome, you used `<select>`
  instead of a custom popover.
- If the page does a thing that's "different from the others", check
  the latest mini-app the team built (`git log
--oneline src/app/mini-apps/ | head`) and see how they did it.
