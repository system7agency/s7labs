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

### 1. Wrap the result in `<EmailGate>`

The full result rendering of the page must live inside an `EmailGate`. This
is what captures the visitor's email and writes the submission to Supabase.

```tsx
import { EmailGate } from '@/components/mini-apps/EmailGate'
import { SubmitOnce } from '@/components/mini-apps/SubmitOnce'

// inside the result branch of your state machine:
{
  result && (
    <EmailGate
      miniAppSlug="your-slug"
      pattern="upfront"
      initialInput={
        {
          /* whatever the user submitted */
        }
      }
    >
      {({ submitToApi }) => (
        <>
          <SubmitOnce
            submit={submitToApi}
            input={
              {
                /* same as initialInput */
              }
            }
            output={result}
          />
          {/* existing result JSX */}
        </>
      )}
    </EmailGate>
  )
}
```

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

Every mini-app page must include a `<section className="how-it-works">`
with an `<h2>`. This is where you explain to first-time visitors what the
tool does and what they'll get back.

The reference pattern lives in
[`pricing-diagnostic/page.tsx`](../src/app/mini-apps/pricing-diagnostic/page.tsx)
— copy the JSX and the corresponding styles from `page-styles.css`. The
scroll-triggered entrance animation is wired up in `PageScripts.tsx` via
an `IntersectionObserver`; reuse that pattern.

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
