import type { MouseEvent } from 'react'

/**
 * Smooth-scroll to an in-page section without writing the `#hash` into the
 * URL. Falls back to an instant jump when the user prefers reduced motion.
 */
export function smoothScrollTo(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
}

/**
 * Click handler for `<a href="#…">` links: prevents the default jump (and the
 * hash landing in the address bar) and smooth-scrolls instead. The href stays
 * on the element as a no-JS / accessibility fallback.
 */
export function handleAnchorClick(e: MouseEvent<HTMLAnchorElement>) {
  const href = e.currentTarget.getAttribute('href')
  if (!href || !href.startsWith('#') || href === '#') return
  e.preventDefault()
  smoothScrollTo(href.slice(1))
}
