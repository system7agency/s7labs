/**
 * Shared user-facing microcopy for the mini-apps.
 *
 * These strings were duplicated verbatim across all 23 apps' `handleSubmit`
 * (validation + lead-save + model-call error paths). They are collected here
 * so the wording stays identical everywhere and can be changed in one place.
 * The canonical wording is documented in `docs/mini-apps-guide.md` (the
 * `handleSubmit` section).
 *
 * IMPORTANT — do NOT move these CI-enforced literals into this file:
 *   - the leads-submit fetch URL,
 *   - the email-regex import from the disposable-email lib,
 *   - the per-app slug body field.
 * `scripts/check-mini-apps.mjs` greps each page.tsx for those literals
 * inline, so they must stay in every page, not be abstracted away here.
 * (None of those literals appear in this file by design.)
 */

/**
 * Canonical user-facing strings for the submit / validation / error flow.
 *
 * Use these instead of hand-typing the copy in each app so a single edit
 * propagates everywhere and nothing drifts.
 */
export const strings = {
  /** Thrown when the model-call `fetch` rejects (offline, DNS, abort, etc.). */
  ERR_NETWORK: 'Network error. Please check your connection and try again.',

  /** Lead-save request failed or returned a non-ok body. */
  ERR_LEAD_SAVE: "Couldn't save your info. Try again.",

  /** Work-email field left blank on submit. */
  ERR_EMAIL_REQUIRED: 'Please enter your work email.',

  /** Work-email field present but fails the shared email regex. */
  ERR_EMAIL_INVALID: 'Please enter a valid email.',

  /** Catch-all fallback when no more specific message is available. */
  ERR_GENERIC: 'Something went wrong. Please try again.',

  /** Helper text under the work-email field in the idle form. */
  EMAIL_HELPER: 'We send the report to your work email. No spam.',

  /** Label on the "Try again" button in the error state. */
  TRY_AGAIN: 'Try again',
} as const

export type StringKey = keyof typeof strings

/**
 * Submit-button verb convention.
 *
 * Submit buttons use an imperative verb + object, present tense, with NO
 * gerunds: "Run it", "Generate ideas", "Analyze page", "Scan stack". The
 * gerund form ("Generating…", "Analyzing…") belongs to the loading state,
 * never to the button itself.
 *
 * Pick the verb whose family best matches what the app does. This object is a
 * reference for choosing a label; it is intentionally NOT a mapping of
 * slug -> label (each app still owns its exact button text in its own JSX).
 */
export const SUBMIT_VERBS = {
  /** Execute a tool / kick off a job. e.g. "Run it", "Run the check". */
  Run: 'execute a tool or kick off a job',
  /** Produce new content. e.g. "Generate ideas", "Generate brief". */
  Generate: 'produce new content (ideas, copy, a brief, a plan)',
  /** Inspect an input and report findings. e.g. "Analyze page". */
  Analyze: 'inspect an input and report findings',
  /** Sweep an external surface for signals. e.g. "Scan stack". */
  Scan: 'sweep an external surface or record for signals',
  /** Lay out relationships / a landscape. e.g. "Map the market". */
  Map: 'lay out relationships, a landscape, or a journey',
  /** Improve an existing artifact. e.g. "Optimize copy". */
  Optimize: 'improve or tighten an existing artifact',
  /** Suggest a best option. e.g. "Recommend a stack". */
  Recommend: 'suggest a best option or next action',
} as const

export type SubmitVerb = keyof typeof SUBMIT_VERBS
