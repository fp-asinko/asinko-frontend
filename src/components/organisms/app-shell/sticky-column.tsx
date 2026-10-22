'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/**
 * The right column, as Reddit's (PO, 2026-10-21): no scroll of its own. Shorter than the screen,
 * it stays under the top bar; taller, it scrolls with the page and, once its end reaches the
 * bottom of the screen, it stays there. CSS cannot take an element's own height for its sticky
 * top, so it is measured: top = min(the bar's height, the screen's height - the column's), again
 * whenever the column or the window changes size. Until it hydrates, it sticks under the bar.
 */
export function StickyColumn({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const column = ref.current
    if (!column || typeof ResizeObserver === 'undefined') return
    function place() {
      const bar = document.querySelector('[data-site-header]')?.getBoundingClientRect().height ?? 60
      column!.style.top = `${Math.min(bar, window.innerHeight - column!.offsetHeight)}px`
    }
    place()
    const observer = new ResizeObserver(place)
    observer.observe(column)
    window.addEventListener('resize', place)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', place)
    }
  }, [])

  return (
    <aside ref={ref} aria-label={label} className={className}>
      {children}
    </aside>
  )
}
