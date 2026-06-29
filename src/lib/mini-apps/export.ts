/**
 * Shared, branded export utility for the S7 Labs mini-apps.
 *
 * Replaces the ~14 per-app `handleDownloadPng` / `handleDownloadPdf` /
 * `handleCopy` copies that were unbranded, single-page, and failed silently.
 * Consumed by the shared `ExportControls` component.
 *
 * Renderer: `html-to-image` (`toCanvas`). We moved off `html2canvas@1.4.1`
 * because it cannot rasterize `backdrop-filter` or `color-mix()` — both used by
 * the mini-app panels — so its exports came out blank / black. `html-to-image`
 * renders via an SVG `<foreignObject>`, which the browser paints with its real
 * CSS engine, so modern CSS, CSS variables, and web fonts all render correctly.
 *
 * The S7 brand frame (wordmark header + footer) is composited onto the captured
 * canvas programmatically (not via DOM cloning), so it is pixel-deterministic
 * and never depends on cloned styles resolving. `jspdf` assembles the PDF.
 *
 * PNG/PDF throw on failure (no silent swallow); copy never throws.
 */

/** Options shared by every export. */
export type ExportOpts = {
  /** App slug, e.g. 'pricing-diagnostic'. Used in the footer URL + filename. */
  slug: string
  /** Human-readable app name shown in the branded header, e.g. 'Pricing Page Diagnostic'. */
  appName: string
  /** Base filename WITHOUT extension; the caller has already slugified it. */
  filename: string
  /** Optional subtitle (e.g. the analyzed URL or company) shown under the app name. */
  subject?: string
}

/* ---------------------------------------------------------------------------
 * Brand tokens for the composited frame chrome.
 * ------------------------------------------------------------------------- */
const BRAND = {
  frameBg: '#060608',
  text: '#f2f3f5',
  muted: '#5e6068',
  accent: '#4f8cff',
  accent2: '#04e3ee',
  hairline: 'rgba(255,255,255,0.08)',
  mono: "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  /** CSS px paddings/heights, multiplied by the capture pixelRatio. */
  pad: 32,
  headerH: 56,
  footerH: 44,
} as const

/** Capture sharpness. 2 = retina; we cap effective output below. */
const PIXEL_RATIO = 2
/** Guard against oversized canvases that browsers refuse / corrupt. */
const MAX_CANVAS_PX = 8000

/* ---------------------------------------------------------------------------
 * Core capture (html-to-image → canvas)
 * ------------------------------------------------------------------------- */

/**
 * Capture `el` to a canvas via html-to-image, waiting for fonts first so the
 * export does not flash fallback glyphs.
 */
async function captureRaw(el: HTMLElement): Promise<{ canvas: HTMLCanvasElement; ratio: number }> {
  if (typeof document !== 'undefined' && document.fonts && 'ready' in document.fonts) {
    try {
      await document.fonts.ready
    } catch {
      // Non-fatal; proceed even if the font-loading API rejects.
    }
  }

  const { toCanvas } = await import('html-to-image')

  // Temporarily expand any vertically-scrolled / clamped container inside `el`
  // so the capture includes its FULL content. A `max-height` + `overflow:auto`
  // (or `hidden`) block — e.g. crm-sanity's cleaned-record preview — is
  // otherwise clipped to its visible height in the PNG/PDF, cutting everything
  // below the fold. Restored in `finally` regardless of outcome.
  const restores: Array<() => void> = []
  el.querySelectorAll<HTMLElement>('*').forEach((node) => {
    const cs = getComputedStyle(node)
    const scrollsY = cs.overflowY === 'auto' || cs.overflowY === 'scroll'
    const hiddenClamp = cs.overflowY === 'hidden' && cs.maxHeight !== 'none'
    if (scrollsY || hiddenClamp) {
      const prevMaxHeight = node.style.maxHeight
      const prevOverflowY = node.style.overflowY
      node.style.maxHeight = 'none'
      node.style.overflowY = 'visible'
      restores.push(() => {
        node.style.maxHeight = prevMaxHeight
        node.style.overflowY = prevOverflowY
      })
    }
  })

  try {
    // Read dimensions AFTER expanding so the ratio accounts for the full height.
    const width = el.offsetWidth || 1
    const longEdge = Math.max(width, el.offsetHeight) || 1
    const raw = Math.min(PIXEL_RATIO, MAX_CANVAS_PX / longEdge)
    const ratio = raw > 0 ? raw : 1

    const canvas = await toCanvas(el, {
      pixelRatio: ratio,
      backgroundColor: BRAND.frameBg,
      // cacheBust avoids stale cross-origin image data URIs between runs.
      cacheBust: true,
      // Pin the clone to the on-screen width so text wraps exactly as in the DOM.
      // Without this, html-to-image can lay the cloned content out wider than the
      // output canvas and clip the right edge of long lines (cut-off card text).
      width,
      style: { width: `${width}px`, maxWidth: `${width}px` },
      // Skip any node explicitly opted out of capture.
      filter: (node) => !(node instanceof HTMLElement && node.dataset?.exportIgnore === 'true'),
    })

    return { canvas, ratio }
  } finally {
    restores.forEach((restore) => restore())
  }
}

/* ---------------------------------------------------------------------------
 * Brand frame compositing (drawn onto the canvas; no DOM cloning)
 * ------------------------------------------------------------------------- */

/**
 * Compose the captured result canvas onto a larger canvas with the S7 brand
 * header above and footer below, plus consistent padding. Returns the framed
 * canvas. Everything is drawn with the 2D context, so it is deterministic and
 * independent of page CSS.
 */
function frameCanvas(
  content: HTMLCanvasElement,
  ratio: number,
  opts: ExportOpts
): HTMLCanvasElement {
  // The content canvas is at `ratio` device px; scale the chrome (defined in
  // CSS px) to the same density so header/footer match the captured content.
  const s = ratio > 0 ? ratio : PIXEL_RATIO

  const pad = BRAND.pad * s
  const headerH = BRAND.headerH * s
  const footerH = BRAND.footerH * s

  const out = document.createElement('canvas')
  out.width = content.width + pad * 2
  out.height = content.height + pad * 2 + headerH + footerH

  const ctx = out.getContext('2d')
  if (!ctx) throw new Error('Could not acquire 2D context for branded frame')

  // Frame background.
  ctx.fillStyle = BRAND.frameBg
  ctx.fillRect(0, 0, out.width, out.height)

  const cx = pad // content/chrome left edge
  const innerW = content.width

  // ---- Header: "S7 LABS" wordmark + app name (left), subject (right) ----
  const headerY = pad
  const wordmarkSize = 15 * s
  ctx.textBaseline = 'alphabetic'
  ctx.font = `600 ${wordmarkSize}px ${BRAND.mono}`
  ctx.textAlign = 'left'
  const wordmarkBaseline = headerY + wordmarkSize
  ctx.fillStyle = BRAND.accent
  ctx.fillText('S7', cx, wordmarkBaseline)
  const s7W = ctx.measureText('S7').width
  ctx.fillStyle = BRAND.text
  // letter-spacing-ish gap before LABS
  ctx.fillText(' LABS', cx + s7W, wordmarkBaseline)

  // App name under the wordmark.
  ctx.font = `500 ${11 * s}px ${BRAND.mono}`
  ctx.fillStyle = BRAND.muted
  ctx.fillText(opts.appName.toUpperCase(), cx, wordmarkBaseline + 16 * s)

  // Subject on the right (analyzed url / company).
  if (opts.subject) {
    ctx.textAlign = 'right'
    ctx.font = `500 ${11 * s}px ${BRAND.mono}`
    ctx.fillStyle = BRAND.accent2
    ctx.fillText(opts.subject, cx + innerW, wordmarkBaseline)
    ctx.textAlign = 'left'
  }

  // ---- Content ----
  const contentY = pad + headerH
  ctx.drawImage(content, cx, contentY)

  // ---- Footer: hairline + s7labs.ai/<slug> (left), generated date (right) ----
  const footerTop = contentY + content.height + pad * 0.5
  ctx.strokeStyle = BRAND.hairline
  ctx.lineWidth = Math.max(1, s)
  ctx.beginPath()
  ctx.moveTo(cx, footerTop)
  ctx.lineTo(cx + innerW, footerTop)
  ctx.stroke()

  const footerBaseline = footerTop + 22 * s
  ctx.font = `500 ${10.5 * s}px ${BRAND.mono}`
  ctx.textAlign = 'left'
  ctx.fillStyle = BRAND.accent
  ctx.fillText('s7labs.ai', cx, footerBaseline)
  const domW = ctx.measureText('s7labs.ai').width
  ctx.fillStyle = BRAND.muted
  ctx.fillText(`/${opts.slug}`, cx + domW, footerBaseline)

  const dateStr = `Generated ${new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })}`
  ctx.textAlign = 'right'
  ctx.fillStyle = BRAND.muted
  ctx.fillText(dateStr, cx + innerW, footerBaseline)
  ctx.textAlign = 'left'

  return out
}

/** Capture + frame in one step. */
async function captureFramed(el: HTMLElement, opts: ExportOpts): Promise<HTMLCanvasElement> {
  const { canvas, ratio } = await captureRaw(el)
  return frameCanvas(canvas, ratio, opts)
}

/* ---------------------------------------------------------------------------
 * PNG
 * ------------------------------------------------------------------------- */

/**
 * Capture `el` to a branded PNG and trigger a browser download.
 * Throws a descriptive Error on failure so the caller can show a toast.
 */
export async function capturePng(el: HTMLElement, opts: ExportOpts): Promise<void> {
  try {
    const canvas = await captureFramed(el, opts)
    const link = document.createElement('a')
    link.download = `${opts.filename}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  } catch (err) {
    throw new Error(
      `Failed to export PNG for "${opts.appName}": ${err instanceof Error ? err.message : String(err)}`
    )
  }
}

/* ---------------------------------------------------------------------------
 * PDF (single continuous page)
 * ------------------------------------------------------------------------- */

const A4_WIDTH_MM = 210
const PAGE_MARGIN_MM = 10
const PRINTABLE_WIDTH_MM = A4_WIDTH_MM - PAGE_MARGIN_MM * 2 // 190mm

/**
 * Capture `el` to a single-page PDF sized to the content (A4 width × content
 * height) and trigger a download. One continuous page means a page break can
 * never slice through a line of text — the earlier multi-page A4 slicer cut
 * lines straight across the page boundary. Throws a descriptive Error on failure.
 */
export async function capturePdf(el: HTMLElement, opts: ExportOpts): Promise<void> {
  try {
    const canvas = await captureFramed(el, opts)
    const { jsPDF } = await import('jspdf')

    const mmPerPx = PRINTABLE_WIDTH_MM / canvas.width
    const imgHeightMm = canvas.height * mmPerPx
    const pageHeightMm = imgHeightMm + PAGE_MARGIN_MM * 2

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [A4_WIDTH_MM, pageHeightMm],
    })
    pdf.addImage(
      canvas.toDataURL('image/png'),
      'PNG',
      PAGE_MARGIN_MM,
      PAGE_MARGIN_MM,
      PRINTABLE_WIDTH_MM,
      imgHeightMm
    )

    pdf.save(`${opts.filename}.pdf`)
  } catch (err) {
    throw new Error(
      `Failed to export PDF for "${opts.appName}": ${err instanceof Error ? err.message : String(err)}`
    )
  }
}

/* ---------------------------------------------------------------------------
 * Clipboard
 * ------------------------------------------------------------------------- */

/**
 * Copy `text` to the clipboard. Tries the async Clipboard API first, then falls
 * back to the legacy hidden-textarea `execCommand('copy')` trick. Returns `true`
 * on success so the caller can drive a "Copied!" toast. Never throws.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.top = '0'
      ta.style.left = '0'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.focus()
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      return ok
    } catch {
      return false
    }
  }
}
