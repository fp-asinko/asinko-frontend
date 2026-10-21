'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * A list that shows only the items that fit whole in its height (specs/sidebar-fill SF-02): it
 * wraps into a second column out of sight (flex-wrap, clipped), so none is ever cut; once
 * hydrated, the ones out of sight are hidden too, out of the keyboard and of what is read (SF-06).
 * Measured again whenever its height changes (zoom, a resized window) or an item goes. Until it
 * hydrates, a clipped item can still take the focus: a short window, known (WCAG 2.4.11).
 */
export function FitList({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLUListElement>(null)

  useEffect(() => {
    const list = ref.current
    if (!list || typeof ResizeObserver === 'undefined') return
    function fit() {
      const items = [...list!.children] as HTMLElement[]
      for (const item of items) item.hidden = false
      const first = items[0]?.offsetLeft ?? 0
      for (const item of items) item.hidden = item.offsetLeft !== first
    }
    fit()
    // Its height changed (zoom, a resized window), or an item went (joined): measured again.
    const resized = new ResizeObserver(fit)
    resized.observe(list)
    const changed = new MutationObserver(fit)
    changed.observe(list, { childList: true })
    return () => {
      resized.disconnect()
      changed.disconnect()
    }
  }, [])

  return (
    <ul
      ref={ref}
      className={cn(
        'flex h-full flex-col flex-wrap content-start overflow-hidden *:w-full',
        className,
      )}
    >
      {children}
    </ul>
  )
}
