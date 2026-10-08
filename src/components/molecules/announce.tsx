'use client'

import { useEffect } from 'react'

/**
 * Says a text in a live region that is already on the page (`role="status"`, by its id). A region
 * that arrives with its text inside (a new Suspense, a streamed result) is often not announced;
 * one that stays and changes is (WCAG 4.1.3). Renders nothing; clears the region when it goes.
 */
export function Announce({ regionId, text }: { regionId: string; text: string }) {
  useEffect(() => {
    const region = document.getElementById(regionId)
    if (!region) return
    region.textContent = text
    return () => {
      region.textContent = ''
    }
  }, [regionId, text])
  return null
}
