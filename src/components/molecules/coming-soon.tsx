'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { useTranslations } from 'next-intl'
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

const VISIBLE_MS = 2000
/** Space kept between the bubble and the edge that would cut it. */
const EDGE_PX = 4

/** The box that cuts the bubble: the closest ancestor that clips overflow, or the viewport. */
function clippingBox(element: HTMLElement): { left: number; right: number } {
  for (let node = element.parentElement; node; node = node.parentElement) {
    if (getComputedStyle(node).overflowX !== 'visible') return node.getBoundingClientRect()
  }
  return { left: 0, right: document.documentElement.clientWidth }
}

/**
 * Where the "Coming soon" bubble opens. Centered by default; -end aligns it to the button's right
 * edge (buttons at the right of a card or the screen), above for the bottom bar.
 */
const bubble = cva(
  'pointer-events-none absolute z-50 rounded-md bg-primary px-2 py-1 type-meta whitespace-nowrap text-primary-foreground transition-[opacity,translate] duration-150 ease-out',
  {
    variants: {
      placement: {
        below: 'top-full left-1/2 mt-1.5 -translate-x-1/2',
        'below-end': 'top-full right-0 mt-1.5',
        above: 'bottom-full left-1/2 mb-1.5 -translate-x-1/2',
        'above-end': 'right-0 bottom-full mb-1.5',
      },
    },
    defaultVariants: { placement: 'below' },
  },
)

/** Hidden, the bubble sits 2px toward the button, so it slides out of it when shown. */
function hiddenOffset(placement: VariantProps<typeof bubble>['placement']) {
  return placement === 'above' || placement === 'above-end'
    ? 'translate-y-0.5 opacity-0'
    : '-translate-y-0.5 opacity-0'
}

/**
 * A feature that exists in the prototype but not yet in the product (H-26). Looks dimmed, can be
 * focused, is announced as unavailable (aria-disabled, not disabled) and says "Coming soon" when
 * activated by tap, click or keyboard. If the bubble would be cut by a scrolling column or the
 * screen edge, it moves inward just enough (which item touches an edge depends on the language).
 * No dependencies (~1 KB).
 */
export function ComingSoon({
  label,
  children,
  className,
  placement,
}: VariantProps<typeof bubble> & {
  /** Accessible name of the unavailable action, e.g. "Search". */
  label: string
  children: ReactNode
  className?: string
}) {
  const t = useTranslations('common')
  const [visible, setVisible] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const bubbleRef = useRef<HTMLSpanElement>(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  // Measured once the text is in (its width is known), before paint: no visible jump.
  useLayoutEffect(() => {
    const element = bubbleRef.current
    if (!visible || !element) return
    element.style.marginLeft = ''
    const box = element.getBoundingClientRect()
    const limit = clippingBox(element)
    const shift =
      Math.max(limit.left + EDGE_PX - box.left, 0) -
      Math.max(box.right - (limit.right - EDGE_PX), 0)
    if (shift) element.style.marginLeft = `${shift}px`
  }, [visible])

  function show() {
    setVisible(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setVisible(false), VISIBLE_MS)
  }

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-disabled="true"
        aria-label={label}
        onClick={show}
        className={cn(
          'cursor-not-allowed opacity-55 outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
          className,
        )}
      >
        {children}
      </button>
      <span
        ref={bubbleRef}
        role="status"
        className={cn(
          bubble({ placement }),
          visible ? 'translate-y-0 opacity-100' : hiddenOffset(placement),
        )}
      >
        {visible ? t('comingSoon') : ''}
      </span>
    </span>
  )
}
