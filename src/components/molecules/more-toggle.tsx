'use client'

import { useEffect, useState } from 'react'

/**
 * "more" under a list that shows what fits (specs/sidebar-more): only while some item is out of
 * sight, it shows them all; then "less" shows again what fits. The list stays as it is: the section
 * reads `data-more="open"` by CSS (`group-has-data-[more=open]/section:`). A disclosure, named by
 * what it says and the section it belongs to.
 */
export function MoreToggle({
  controls,
  section,
  more,
  less,
}: {
  /** The list's id. */
  controls: string
  /** The section's name, for who cannot see where it is ("more: Groups"). */
  section: string
  more: string
  less: string
}) {
  const [open, setOpen] = useState(false)
  const [hiding, setHiding] = useState(false)

  // Whether the list hides some item now: by its height or its maximum. Measured again when the
  // column's height changes (zoom, a resized window) or an item goes.
  useEffect(() => {
    const list = document.getElementById(controls)
    if (!list || typeof ResizeObserver === 'undefined') return
    const measure = () =>
      setHiding([...list.children].some((item) => getComputedStyle(item).display === 'none'))
    measure()
    const resized = new ResizeObserver(measure)
    resized.observe(list)
    if (list.parentElement) resized.observe(list.parentElement)
    const changed = new MutationObserver(measure)
    changed.observe(list, { childList: true })
    return () => {
      resized.disconnect()
      changed.disconnect()
    }
  }, [controls])

  if (!open && !hiding) return null
  return (
    <button
      type="button"
      data-more={open ? 'open' : 'closed'}
      aria-expanded={open}
      aria-controls={controls}
      // What it says first, then its section (WCAG 2.5.3): "more: Groups".
      aria-label={`${open ? less : more}: ${section}`}
      onClick={() => setOpen(!open)}
      className="h-6 tap rounded-sm px-1.5 text-[0.625rem] font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {open ? less : more}
    </button>
  )
}
