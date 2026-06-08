# Mini-apps convention

How to add a new mini-app to s7labs.ai so it captures leads, ships analytics,
and survives the CI check.

The reference port is [`src/app/mini-apps/pricing-diagnostic/`](../src/app/mini-apps/pricing-diagnostic/).
Copy its structure when in doubt.

## Folder layout

```
src/app/mini-apps/<your-slug>/
  page.tsx           # entry, default export
  page-styles.css    # co-located styles (imported by page.tsx)
  PageScripts.tsx    # client-only effects (cursor spotlight, observers, …)
```

The folder name does **not** have to match the Supabase slug, but matching
them is strongly recommended for grep-ability.

## Required (the CI check enforces these)

A pull request that touches `src/app/mini-apps/**` runs
[`scripts/check-mini-apps.mjs`](../scripts/check-mini-apps.mjs). In CI the
script scopes itself to **only the mini-apps whose `page.tsx` was changed in
the PR** — unrelated stragglers don't block your PR. Run it locally without
`GITHUB_BASE_REF` set to check every mini-app in the repo.

### 1. Use the inline email gate pattern

The visitor's email must be captured **before** the model call, not after.
This protects against credit waste when a visitor enters a disposable or
free-provider email and bails at the gate. The pattern:

- Inline a `Work email` field in the main form, alongside the app's other
  inputs. Use the `EMAIL_REGEX` from `@/lib/leads/disposable` for
  client-side format validation.
- On submit, validate both inputs locally, then **first** POST to
  `/api/leads/submit` with `{ email, miniAppSlug, input }`. The server
  rejects disposable + free-provider emails before any model token is
  spent. Bail and surface the error on the email field if it fails.
- Only on success, fire the actual `/api/mini-apps/<slug>` model call.
- On model success, fire-and-forget POST to `/api/leads/complete` with
  `{ submissionId, output, cost? }` to mark the submission complete.

Reference: [`pricing-diagnostic/page.tsx`](../src/app/mini-apps/pricing-diagnostic/page.tsx)
is the gold standard. [`crm-sanity/page.tsx`](../src/app/mini-apps/crm-sanity/page.tsx)
is the closest reference for textarea-input apps.

Sketch of `handleSubmit`:

```tsx
// 1. Local validation
if (!input || !EMAIL_REGEX.test(email)) {
  setEmailError('Please enter a valid email.')
  return
}

// 2. Save lead FIRST — server enforces disposable + free-provider blocks
let submissionId: string | null = null
const res = await fetch('/api/leads/submit', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    email,
    miniAppSlug: 'your-slug',
    input: {
      /* what the user submitted */
    },
  }),
})
const json = await res.json()
if (!res.ok || !json.ok || !json.submissionId) {
  setEmailError(json.error || "Couldn't save your info. Try again.")
  return
}
submissionId = json.submissionId

// 3. Now fire the model
const modelRes = await fetch('/api/mini-apps/your-slug', { ... })

// 4. After model success, mark the submission complete (fire-and-forget)
fetch('/api/leads/complete', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    submissionId,
    output: data.data,
    ...(data.cost ? { cost: data.cost } : {}),
  }),
}).catch((err) => console.error('[your-slug] leads/complete', err))
```

The CI check enforces the inline pattern by requiring an import of
`EMAIL_REGEX` from `@/lib/leads/disposable` AND a literal string
`/api/leads/submit` in the page source, plus a `miniAppSlug: '<slug>'`
field somewhere in the file that matches an active row in the
`mini_apps` Supabase table.

The old `<EmailGate>` overlay component still exists in the codebase but
is **no longer the convention** — all live mini-apps have been migrated
to the inline pattern. Don't introduce new uses.

### 2. Register the slug in the `mini_apps` Supabase table

Run this against the project DB (Supabase SQL editor, or via MCP):

```sql
insert into mini_apps (slug, name, description, category, status)
values (
  'your-slug',
  'Your App Display Name',
  'Short tagline.',
  'diagnostic',   -- one of: diagnostic | finder | enrichment | linkedin | email | strategy | visibility | benchmark | other
  'active'
)
on conflict (slug) do nothing;
```

If the slug isn't in the table, lead capture fails at runtime with
`Unknown mini-app` and the CI check blocks the PR.

### 3. Include a "How it works" section

Every mini-app page must include a "How it works" section that explains
what the tool does and what visitors get back. Easiest path is the shared
component:

```tsx
import { HowItWorks, type HowItWorksStep } from '@/components/mini-apps/HowItWorks'

const STEPS: HowItWorksStep[] = [
  { title: '...', description: '...', icon: <svg>...</svg> },
  // 4 steps total is the convention
]

// inside the page render, somewhere before </main>:
<HowItWorks
  title={<>From X to <span className="accent">Y</span></>}
  subtitle="One-line subtitle."
  steps={STEPS}
/>
```

The component handles the alternating timeline, animations, and responsive
behaviour. The CSS uses each mini-app's existing palette variables
(`--blue`, `--text`, `--text-muted`, `--border`) so it looks consistent.

If you need a non-standard layout, the CI check also accepts a direct
`<section className="how-it-works">` block with an `<h2>` — see
[`pricing-diagnostic/page.tsx`](../src/app/mini-apps/pricing-diagnostic/page.tsx)
for the reference pattern.

## Running the check locally

```bash
NEXT_PUBLIC_SUPABASE_URL=... \
NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
  node scripts/check-mini-apps.mjs
```

Both env vars are already in `.env.local`; you can `set -a; source .env.local; set +a`
to load them.

## CI secrets

The workflow at [`.github/workflows/mini-apps-check.yml`](../.github/workflows/mini-apps-check.yml)
pulls the Supabase URL and anon key from repo secrets:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

The anon key is safe to expose in CI because the `mini_apps` table has a
read-only RLS policy for the `anon` role.

## Mini-app registry vs. landing page registry

Two registries today:

- **`src/app/mini-apps/_data/apps.ts`** — controls what cards render on
  `/mini-apps`. Hardcoded in code.
- **`mini_apps` Supabase table** — controls what slugs `/api/leads/submit`
  accepts, and is the canonical analytics grouping key.

Both must list a mini-app for it to work end-to-end. The CI check covers the
DB side; please remember to also add an entry to `apps.ts` so the card shows
up on the marketplace.
