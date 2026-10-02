'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

const VISIBLE_MS = 2000

/**
 * Where the "Coming soon" bubble opens. Centered by default; -end aligns it to the button's right
 * edge (buttons at the right of a card or the screen), above for the bottom bar.
 */
const bubble = cva(
  'pointer-events-none absolute z-50 rounded-md bg-primary px-2 py-1 type-meta whitespace-nowrap text-primary-foreground transition-opacity motion-reduce:transition-none',
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

/**
 * A feature that exists in the prototype but not yet in the product (H-26). Looks dimmed, can be
 * focused, is announced as unavailable (aria-disabled, not disabled) and says "Coming soon" when
 * activated by tap, click or keyboard. No dependencies (~1 KB).
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

  useEffect(() => () => clearTimeout(timer.current), [])

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
        role="status"
        className={cn(bubble({ placement }), visible ? 'opacity-100' : 'opacity-0')}
      >
        {visible ? t('comingSoon') : ''}
      </span>
    </span>
  )
}
