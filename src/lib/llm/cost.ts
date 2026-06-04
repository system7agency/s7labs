/**
 * Per-million-token pricing for each Claude model we use.
 * Keep in sync with https://docs.anthropic.com/en/docs/about-claude/models
 * Last updated: 2026-06-04
 */
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // Claude 4 family
  'claude-sonnet-4-20250514': { input: 3.0, output: 15.0 },
  'claude-opus-4-20250514': { input: 15.0, output: 75.0 },
  'claude-haiku-4-5-20251001': { input: 1.0, output: 5.0 },
  // Aliases sometimes returned by the SDK
  'claude-opus-4-5': { input: 15.0, output: 75.0 },
  'claude-opus-4-7': { input: 15.0, output: 75.0 },
  'claude-sonnet-4-6': { input: 3.0, output: 15.0 },
}

export type ModelUsage = {
  model: string
  inputTokens: number
  outputTokens: number
}

export type CostBreakdown = {
  model: string
  inputTokens: number
  outputTokens: number
  costUsd: number
}

/**
 * Sentinel breakdown for submissions that didn't make an LLM call.
 * Useful for pure-JS mini-apps that still need an explicit cost row.
 */
export const ZERO_COST: CostBreakdown = {
  model: 'none',
  inputTokens: 0,
  outputTokens: 0,
  costUsd: 0,
}

export function calculateCost(usage: ModelUsage): CostBreakdown {
  const pricing = MODEL_PRICING[usage.model]
  if (!pricing) {
    console.warn(`[llm/cost] No pricing config for model "${usage.model}". Returning 0 cost.`)
    return {
      model: usage.model,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      costUsd: 0,
    }
  }
  const inputCost = (usage.inputTokens / 1_000_000) * pricing.input
  const outputCost = (usage.outputTokens / 1_000_000) * pricing.output
  return {
    model: usage.model,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    costUsd: Number((inputCost + outputCost).toFixed(6)),
  }
}

/**
 * Sum multiple usages into a single breakdown.
 * Use when a single submission makes more than one LLM call.
 * All usages must share the same model name.
 */
export function sumUsage(usages: ModelUsage[]): ModelUsage {
  if (usages.length === 0) {
    return { model: 'none', inputTokens: 0, outputTokens: 0 }
  }
  const model = usages[0]!.model
  let inputTokens = 0
  let outputTokens = 0
  for (const u of usages) {
    if (u.model !== model) {
      console.warn(
        `[llm/cost] sumUsage mixing models: "${model}" vs "${u.model}". Cost may be inaccurate.`
      )
    }
    inputTokens += u.inputTokens
    outputTokens += u.outputTokens
  }
  return { model, inputTokens, outputTokens }
}

/**
 * Extract token usage from an Anthropic SDK Messages.create() response.
 * Works for both the streaming and non-streaming shapes.
 */
export function usageFromAnthropic(response: {
  model: string
  usage: { input_tokens: number; output_tokens: number }
}): ModelUsage {
  return {
    model: response.model,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  }
}
