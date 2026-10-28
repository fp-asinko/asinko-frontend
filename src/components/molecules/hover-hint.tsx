import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * A small dark bubble over a control saying what it does, as Reddit's: on hover, and while the
 * keyboard's focus is in it (PO, 2026-10-27). Only CSS, no JavaScript. Never on touch: Tailwind's
 * hover only applies with a pointer that hovers. The control keeps its own name (aria-label): the
 * bubble repeats it for the eye, so it is hidden from assistive tech.
 */
export function HoverHint({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <span className={cn('group/hint relative inline-flex', className)}>
      {children}
      <span
        aria-hidden
        data-hint
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 -translate-x-1/2 rounded-md bg-foreground px-2 py-1 type-meta font-medium whitespace-nowrap text-background opacity-0 transition-opacity duration-150 ease-out group-hover/hint:opacity-100 group-has-[:focus-visible]/hint:opacity-100"
      >
        {label}
      </span>
    </span>
  )
}
