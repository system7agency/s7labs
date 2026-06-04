# LLM cost helper

Server-side utility for attaching cost-per-submission to every mini-app run.
Powers the `/insights` dashboard.

## What's here

- `cost.ts` — `calculateCost`, `usageFromAnthropic`, `sumUsage`, `ZERO_COST`.
- This README.

The helper is **server-only**. It's safe to import in API routes; do not
import it into client components (raw pricing data shouldn't leak to the
browser).

## How to record cost from a mini-app

In the mini-app's API route, after the Anthropic SDK call:

```ts
import { calculateCost, usageFromAnthropic } from '@/lib/llm/cost'

const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  // ...
})
const usage = usageFromAnthropic(response)
const cost = calculateCost(usage)

return NextResponse.json({ ok: true, result, cost })
```

Then on the client, when calling `submitToApi`, the wrapper API
(`/api/leads/complete`) accepts an optional `cost` field and writes it
straight to the `submissions` row alongside `output`:

```ts
await fetch('/api/leads/complete', {
  method: 'POST',
  body: JSON.stringify({ submissionId, output: result, cost }),
})
```

### Multiple LLM calls per submission

Sum them up before computing cost. All calls must share the same model
(otherwise we'd misprice — `sumUsage` warns if they don't).

```ts
import { calculateCost, sumUsage, usageFromAnthropic } from '@/lib/llm/cost'

const r1 = await anthropic.messages.create({ ... })
const r2 = await anthropic.messages.create({ ... })

const totalUsage = sumUsage([usageFromAnthropic(r1), usageFromAnthropic(r2)])
const cost = calculateCost(totalUsage)
```

### Mini-apps that don't use an LLM

Use the `ZERO_COST` sentinel so the dashboard still shows an explicit
zero row instead of a `NULL` blackhole:

```ts
import { ZERO_COST } from '@/lib/llm/cost'
return NextResponse.json({ ok: true, result, cost: ZERO_COST })
```

## How to add a new model

Open `cost.ts` and add an entry to `MODEL_PRICING`:

```ts
'claude-future-model-id': { input: 4.5, output: 22.5 },
```

Numbers are USD per **million** tokens, exactly as published by Anthropic.

## Updating pricing when Anthropic changes rates

1. Open https://docs.anthropic.com/en/docs/about-claude/models
2. Find the model row → grab "Input" and "Output" cost per million tokens
3. Update the matching entry in `MODEL_PRICING`
4. Bump the `Last updated:` comment at the top of the file
5. Commit. No DB migration needed — pricing applies to all future writes.

## Verification query

After a test submission you should see all four cost fields populated:

```sql
SELECT mini_app_slug, model_used, input_tokens, output_tokens, cost_usd
FROM submissions
ORDER BY created_at DESC
LIMIT 5;
```

A Sonnet 4 call with ~2,000 input and ~800 output tokens should land near
**$0.018** (= 2000 × $3/M + 800 × $15/M).
