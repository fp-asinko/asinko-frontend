'use client'

import { useLayoutEffect } from 'react'

// Set by the browser's back and forward: there, the page keeps where the reader was.
let returning = false
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    returning = true
  })
}

/**
 * A post's page starts at its top (PO, 2026-10-29), also on a reload, where the browser would put
 * back the last position. Not when the link points somewhere in it (a comment, #…), nor on going
 * back or forward. `id` makes it run again when another post opens in the same page.
 */
export function ScrollToTop({ id }: { id: string }) {
  useLayoutEffect(() => {
    if (returning) {
      returning = false
      return
    }
    if (window.location.hash) return
    window.scrollTo(0, 0)
  }, [id])
  return null
}
