import type { SVGProps } from 'react'

/*
 * The bull and the bear of a thesis's bet (specs/thesis-agree AG-19, PO 2026-11-05): up is
 * bullish, down bearish. Drawn here, as lucide's: a 24px grid, a 2px stroke in the text color, no
 * fill. Lucide has neither. Decorative: the words beside them say it.
 */
type MarkProps = SVGProps<SVGSVGElement>

function Mark({ children, ...props }: MarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  )
}

/** A bull's head: horns up, ears, a muzzle with its nostrils. */
export function BullMark(props: MarkProps) {
  return (
    <Mark data-mark="bull" {...props}>
      <path d="M7 9C4.2 9 2.5 7 2.5 4" />
      <path d="M17 9c2.8 0 4.5-2 4.5-5" />
      <path d="M7 10.5 3.5 10l1.5 2.5H7" />
      <path d="M17 10.5l3.5-.5-1.5 2.5H17" />
      <path d="M7 9h10v5.5a5 5 0 0 1-10 0Z" />
      <path d="M10 16.5h.01" />
      <path d="M14 16.5h.01" />
    </Mark>
  )
}

/** A bear's head: round ears, eyes and a snout. */
export function BearMark(props: MarkProps) {
  return (
    <Mark data-mark="bear" {...props}>
      <path d="M6.6 7.4A2.5 2.5 0 1 1 9.4 4.9" />
      <path d="M14.6 4.9a2.5 2.5 0 1 1 2.8 2.5" />
      <circle cx="12" cy="13" r="7.5" />
      <path d="M9.5 11h.01" />
      <path d="M14.5 11h.01" />
      <ellipse cx="12" cy="15.5" rx="2.5" ry="2" />
      <path d="M12 15h.01" />
    </Mark>
  )
}
