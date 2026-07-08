'use client'

import type { AnchorHTMLAttributes } from 'react'

import { handleAnchorClick } from '@/lib/smooth-scroll'

/**
 * Drop-in `<a>` for in-page `#section` links: smooth-scrolls to the target
 * instead of jumping, and keeps the hash out of the URL. Safe to use from
 * server components.
 */
export function ScrollLink({ onClick, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      {...rest}
      onClick={(e) => {
        onClick?.(e)
        handleAnchorClick(e)
      }}
    />
  )
}
