'use client'

import { cn } from '@/lib/utils'
import { DEPTH, pieSlices, TILT } from '../lib/poll-pie'

const R = 80
const PAD = 10
const WIDTH = (R + PAD) * 2
const HEIGHT = R * TILT * 2 + R * DEPTH + PAD * 2
/** How far a highlighted slice moves out of the disc (PP-04). */
const LIFT = 8

/** The identity hues, written whole: Tailwind only builds the classes it finds (design-system). */
/**
 * The identity hues, soft: mixed with the page's background, solid, so a slice never shows another
 * through (PO, 2026-10-26). Written whole: Tailwind only builds the classes it finds.
 */
export const PIE_FILLS = [
  'fill-[color-mix(in_oklab,var(--avatar-0)_55%,var(--background))]',
  'fill-[color-mix(in_oklab,var(--avatar-1)_55%,var(--background))]',
  'fill-[color-mix(in_oklab,var(--avatar-2)_55%,var(--background))]',
  'fill-[color-mix(in_oklab,var(--avatar-3)_55%,var(--background))]',
  'fill-[color-mix(in_oklab,var(--avatar-4)_55%,var(--background))]',
  'fill-[color-mix(in_oklab,var(--avatar-5)_55%,var(--background))]',
  'fill-[color-mix(in_oklab,var(--avatar-6)_55%,var(--background))]',
  'fill-[color-mix(in_oklab,var(--avatar-7)_55%,var(--background))]',
]
export const PIE_SWATCHES = [
  'bg-[color-mix(in_oklab,var(--avatar-0)_55%,var(--background))]',
  'bg-[color-mix(in_oklab,var(--avatar-1)_55%,var(--background))]',
  'bg-[color-mix(in_oklab,var(--avatar-2)_55%,var(--background))]',
  'bg-[color-mix(in_oklab,var(--avatar-3)_55%,var(--background))]',
  'bg-[color-mix(in_oklab,var(--avatar-4)_55%,var(--background))]',
  'bg-[color-mix(in_oklab,var(--avatar-5)_55%,var(--background))]',
  'bg-[color-mix(in_oklab,var(--avatar-6)_55%,var(--background))]',
  'bg-[color-mix(in_oklab,var(--avatar-7)_55%,var(--background))]',
]

/**
 * A poll's results as a tilted 3D disc (specs/poll-pie): one soft-colored slice per option with
 * votes (PP-02). Decorative for a screen reader: the list beside it says the same in words (PP-06).
 * The slice of `active` moves out, as a whole with its side; the rest stay as they are (PP-04: fading
 * them read as a shadow, PO 2026-10-26). It enters turning once (PP-05, off with reduced motion).
 */
export function PollPie({
  options,
  active,
  onActive,
  className,
}: {
  options: readonly { id: string; share: number | null }[]
  active: string | null
  onActive: (id: string | null) => void
  className?: string
}) {
  const slices = pieSlices(options, { cx: WIDTH / 2, cy: PAD + R * TILT, r: R })
  if (slices.length === 0) return null

  return (
    <svg
      aria-hidden
      data-poll-pie
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className={cn('h-auto w-44 shrink-0 animate-pie-in overflow-visible', className)}
      onPointerLeave={() => onActive(null)}
    >
      {slices.map((slice) => {
        const lifted = active === slice.id
        const fill = PIE_FILLS[slice.color]
        return (
          <g
            key={slice.id}
            data-slice={slice.id}
            onPointerEnter={() => onActive(slice.id)}
            onClick={() => onActive(slice.id)}
            className="transition-transform duration-150 ease-out"
            style={{
              transform: lifted
                ? `translate(${Math.cos(slice.mid) * LIFT}px, ${Math.sin(slice.mid) * LIFT * TILT}px)`
                : undefined,
            }}
          >
            {slice.side && <path d={slice.side} className={cn(fill, 'brightness-75')} />}
            <path d={slice.top} className={cn(fill, 'stroke-background')} strokeWidth={1} />
          </g>
        )
      })}
    </svg>
  )
}
