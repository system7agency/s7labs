/**
 * Master kill-switch for EVERY outbound n8n webhook this app calls:
 *   - the mini-app result email        (N8N_EMAIL_WEBHOOK_URL, send-result-email.ts)
 *   - the RevOps Sales Insights submit  (N8N_SALES_INSIGHTS_WEBHOOK_URL)
 *   - the mini-app lead-capture sync    (capture-lead.ts → N8N_MINI_APPS_LEAD_WEBHOOK_URL
 *                                        with a fallback to the sales-insights webhook)
 *
 * All of these cause n8n to send an email downstream, so this single flag is
 * what guarantees the app triggers NO emails. Hard-off (not env-driven).
 *
 * IMPORTANT: the emails themselves are sent by n8n (system7ai.app.n8n.cloud),
 * not by this app. This flag only stops THIS app from calling n8n. If n8n has
 * its own schedules or other inbound triggers, those must be paused in n8n —
 * and/or the N8N_*_WEBHOOK_URL env vars cleared — for a full guarantee.
 *
 * Typed `boolean` (not the literal `false`) so guarded code paths are not
 * flagged as unreachable. Flip to `true` to re-enable webhook calls.
 */
export const N8N_WEBHOOKS_ENABLED: boolean = false
