/**
 * Result -> email renderer (S7 theme).
 *
 * A short, on-brand transactional email: the S7 LABS heading, a one-line message,
 * a "View full result" button to the live report page, and the footer. It does
 * NOT render the result data itself — the linked page re-renders the real report
 * from the saved output, so the recipient always sees the exact, up-to-date
 * website report. One generic email for every mini-app.
 */
import { C, button, emailShell, escapeHtml } from './email-kit'

export function renderResultEmail(opts: {
  appName: string
  resultUrl: string
  unsubscribeUrl: string
}): { html: string; text: string } {
  const { appName, resultUrl, unsubscribeUrl } = opts
  const name = escapeHtml(appName)

  const body =
    `<p style="margin:0 0 14px;color:${C.text};font-size:15px;line-height:1.6;">` +
    `Your <strong>${name}</strong> report is ready. Open it to see the full interactive result.` +
    `</p>` +
    button('View full result', resultUrl) +
    `<p style="margin:14px 0 0;color:${C.muted};font-size:12px;line-height:1.6;">` +
    `Keep this email. The link stays live, so you can return to your report anytime.` +
    `</p>`

  const html = emailShell({ appName, body, unsubscribeUrl })
  const text = [
    `Your ${appName} report is ready.`,
    '',
    `View full result: ${resultUrl}`,
    '',
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join('\n')

  return { html, text }
}
