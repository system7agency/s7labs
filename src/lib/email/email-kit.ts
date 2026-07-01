/**
 * Shared, email-safe building blocks for S7 Labs result emails.
 *
 * Email clients can't run the page CSS, so per-app templates compose these
 * table-based, inline-styled primitives to reproduce the on-page report look as
 * closely as email allows. The page surface (the report panel) is dark (S7
 * theme); the area around it is light for readability/deliverability.
 */

export const C = {
  outerBg: '#edeff3',
  bg: '#060608',
  panel: '#0e0e12',
  header: '#08080b',
  card: '#15151b',
  cardSoft: '#121217',
  border: '#24252d',
  borderSoft: '#1b1b21',
  text: '#eef1f6',
  dim: '#aab0bd',
  muted: '#6b6e78',
  blue: '#4f8cff',
  cyan: '#04e3ee',
  green: '#4fcf8a',
  amber: '#f5a623',
  red: '#ff5c7a',
  mono: "Consolas, Menlo, Monaco, 'Courier New', monospace",
  sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
} as const

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** `// LABEL` cyan mono section header. */
export function sectionLabel(text: string): string {
  return `<div style="font-family:${C.mono};font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${C.cyan};margin:24px 0 12px;">// ${escapeHtml(
    text
  )}</div>`
}

/** A dark card. `accent` adds a colored left rule. */
export function card(inner: string, accent?: string): string {
  const left = accent ? `border-left:2px solid ${accent};` : ''
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 10px;"><tr><td style="padding:16px 18px;background:${C.card};border:1px solid ${C.border};${left}border-radius:12px;">${inner}</td></tr></table>`
}

/** Small mono uppercase muted label. */
export function microLabel(text: string, color: string = C.muted): string {
  return `<div style="font-family:${C.mono};font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:${color};margin:0 0 5px;">${escapeHtml(
    text
  )}</div>`
}

export function paragraph(text: string, color: string = C.text, size = 14): string {
  return `<p style="margin:0 0 6px;color:${color};font-size:${size}px;line-height:1.6;">${escapeHtml(text)}</p>`
}

/** Pill / badge with a colored outline. */
export function pill(text: string, color: string): string {
  return `<span style="display:inline-block;font-family:${C.mono};font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:${color};border:1px solid ${color};border-radius:999px;padding:3px 10px;white-space:nowrap;">${escapeHtml(
    text
  )}</span>`
}

/** Small colored status dot (square fallback in clients without border-radius). */
export function dot(color: string): string {
  return `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};"></span>`
}

/** Bulletproof (table-based) call-to-action button. */
export function button(label: string, href: string, color: string = C.blue): string {
  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0 6px;"><tr><td align="center" style="border-radius:10px;background:${color};">` +
    `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 30px;font-family:${C.sans};font-size:15px;font-weight:600;line-height:1;color:#ffffff;text-decoration:none;border-radius:10px;">${escapeHtml(
      label
    )}</a>` +
    `</td></tr></table>`
  )
}

/** Wrap a per-app body in the branded panel; the surround is light. */
export function emailShell(opts: {
  appName: string
  body: string
  unsubscribeUrl: string
}): string {
  const { appName, body, unsubscribeUrl } = opts
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:${C.outerBg};font-family:${C.sans};-webkit-font-smoothing:antialiased;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.outerBg};padding:28px 12px;">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${C.panel};border:1px solid ${C.border};border-radius:14px;overflow:hidden;">
          <tr><td style="background:${C.header};padding:22px 28px;border-bottom:1px solid ${C.borderSoft};">
            <span style="font-family:${C.mono};font-weight:700;font-size:15px;color:${C.blue};">S7</span><span style="font-family:${C.mono};font-weight:600;font-size:15px;color:${C.text};"> LABS</span>
            <div style="font-family:${C.mono};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${C.muted};margin-top:7px;">${escapeHtml(
              appName
            )}</div>
          </td></tr>
          <tr><td style="padding:24px 28px 26px;">
            <p style="margin:0 0 14px;font-family:${C.sans};font-size:18px;font-weight:600;letter-spacing:-0.01em;color:${C.text};">Your ${escapeHtml(
              appName
            )} result</p>
            ${body}
          </td></tr>
        </table>
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr><td align="center" style="padding:18px 20px 4px;">
            <p style="margin:0;font-family:${C.mono};font-size:10px;letter-spacing:0.04em;line-height:1.7;color:#8a8f99;">SENT BY S7 LABS &middot; <a href="https://s7labs.ai" style="color:#6f7682;text-decoration:none;">s7labs.ai</a> &middot; <a href="${escapeHtml(
              unsubscribeUrl
            )}" style="color:#6f7682;text-decoration:none;">Unsubscribe</a></p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`
}
