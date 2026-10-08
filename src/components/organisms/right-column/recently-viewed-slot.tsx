'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

// The list, its formats and its events: downloaded once the page is idle (RV-08, seo.md).
const RecentlyViewed = dynamic(
  () => import('./recently-viewed').then((mod) => mod.RecentlyViewed),
  {
    ssr: false,
  },
)

/** Where the right column exists (lg): below it there is nothing to show, nor to download. */
const WIDE = '(min-width: 1024px)'

/**
 * Brings "Recently viewed" into the right column (specs/recently-viewed § 4) after the page is
 * ready, and only where the column shows: a phone never downloads it. It goes below the cards
 * that are already there, so arriving late moves nothing.
 */
export function RecentlyViewedSlot() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const wide = window.matchMedia(WIDE)
    let idle: number | undefined
    const start = () => {
      const run = () => setReady(true)
      idle =
        typeof window.requestIdleCallback === 'function'
          ? window.requestIdleCallback(run, { timeout: 2000 })
          : window.setTimeout(run, 200)
    }
    if (wide.matches) {
      start()
      return () => {
        if (idle === undefined) return
        if (typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idle)
        else window.clearTimeout(idle)
      }
    }
    // A window that grows into the column later.
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) start()
    }
    wide.addEventListener('change', onChange)
    return () => wide.removeEventListener('change', onChange)
  }, [])

  return ready ? <RecentlyViewed /> : null
}
