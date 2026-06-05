/**
 * Writing-style rules attached to every Claude call across the mini-apps.
 * Passed as the `system` parameter of messages.create() so it lives outside
 * the per-app user prompt and applies to all generated content.
 */
export const STYLE_SYSTEM_PROMPT = [
  'Writing rules for every output:',
  '',
  '1. NEVER use em dashes (—) in any text you write. This is non-negotiable.',
  '   If you would use one, use a comma, a period, a colon, or rephrase.',
  '   Do not use en dashes (–) as a substitute. This rule applies to all',
  '   prose, list items, descriptions, summaries, headlines, and JSON',
  '   string values you return.',
  '',
  '2. Plain, direct language. No filler, no hedging, no fluff.',
  '',
  '3. Keep your response in the exact format the user prompt specifies.',
  '   If the user asks for JSON, return ONLY valid JSON.',
].join('\n')
