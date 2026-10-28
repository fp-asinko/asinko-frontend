import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Where the bubble goes: over the control, under it (the top bar has no room above), or beside. */
const SIDE = {
  top: 'bottom-full mb-1.5',
  bottom: 'top-full mt-1.5',
  right: 'left-full ml-2 top-1/2 -translate-y-1/2',
} as const

/** How it lines up with the control, over or under it: centered, or from an edge close to one. */
const ALIGN = {
  center: 'left-1/2 -translate-x-1/2',
  start: 'left-0',
  end: 'right-0',
} as const

type Placement = { side?: keyof typeof SIDE; align?: keyof typeof ALIGN }

/**
 * The bubble alone, for a control that cannot be wrapped (a fixed one): it goes inside it, and the
 * control takes the `group/hint` class.
 */
export function HintBubble({
  label,
  side = 'top',
  align = 'center',
}: Placement & { label: string }) {
  return (
    <span
      aria-hidden
      data-hint
      className={cn(
        'pointer-events-none absolute z-50 rounded-md bg-foreground px-2 py-1 type-meta font-medium whitespace-nowrap text-background opacity-0 transition-opacity duration-150 ease-out group-hover/hint:opacity-100 group-focus-visible/hint:opacity-100 group-has-[:focus-visible]/hint:opacity-100',
        'group-has-[[aria-expanded=true]]/hint:hidden group-has-[[role=status]:not(:empty)]/hint:hidden',
        SIDE[side],
        side !== 'right' && ALIGN[align],
      )}
    >
      {label}
    </span>
  )
}

/**
 * A small dark bubble by a control saying what it does, as Reddit's: on hover, and while the
 * keyboard's focus is in it (PO, 2026-10-27). Only CSS, no JavaScript. Never on touch: Tailwind's
 * hover only applies with a pointer that hovers. The control keeps its own name (aria-label): the
 * bubble repeats it for the eye, so it is hidden from assistive tech. It steps aside while the
 * control's menu is open or its "Coming soon" is showing: they say more, in the same place.
 */
export function HoverHint({
  label,
  children,
  side,
  align,
  className,
}: Placement & { label: string; children: ReactNode; className?: string }) {
  return (
    <span className={cn('group/hint relative inline-flex', className)}>
      {children}
      <HintBubble label={label} side={side} align={align} />
    </span>
  )
}
