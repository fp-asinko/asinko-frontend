'use client'

import { useState, type KeyboardEvent, type PointerEvent } from 'react'
import { cn } from '@/lib/utils'

/** A point, with its words made on the server: the client formats nothing. */
type Point = {
  x: number
  y: number
  /** For screen readers: "Oct 13 · $86,200 · +3.1% from entry". */
  label: string
  /** The header's: its price, its change since the entry and its direction, and its date. */
  price: string
  change: string
  trend: 'up' | 'down' | 'flat'
  date: string
}

/** The change's color: green up, red down (on white, design-system.md). */
const TRENDS = { up: 'text-bullish', down: 'text-bearish', flat: 'text-muted-foreground' } as const

/** The point nearest to `x` (0 to 1), by halves: the points go left to right. */
function nearest(points: readonly Point[], x: number): number {
  let low = 0
  let high = points.length - 1
  while (high - low > 1) {
    const middle = (low + high) >> 1
    if (points[middle]!.x < x) low = middle
    else high = middle
  }
  return Math.abs(points[low]!.x - x) <= Math.abs(points[high]!.x - x) ? low : high
}

/** The key's next point, or null for a key that does not walk it. */
function stepped(key: string, shown: number, last: number): number | null {
  if (key === 'ArrowLeft' || key === 'ArrowDown') return Math.max(0, shown - 1)
  if (key === 'ArrowRight' || key === 'ArrowUp') return Math.min(last, shown + 1)
  if (key === 'Home') return 0
  if (key === 'End') return last
  return null
}

/**
 * Walking a thesis's chart (specs/thesis-chart CH-16 to CH-21), a client leaf over its server
 * drawing. On top, a broker's header: the price big and its change since the entry, today's until
 * the chart is walked, then the walked point's (PO, 2026-11-06). Over the chart, a line and a dot on
 * that point. With a pointer or a finger, the nearest point; with the keyboard, ← → one point, Home
 * and End. A slider for screen readers, its value the point's words. Sideways drags walk it,
 * vertical ones still scroll (pan-y). Before it hydrates, today's header shows the same.
 */
export function ChartScrub({
  name,
  points,
  todayLabel,
}: {
  name: string
  points: Point[]
  /** The header's date while not walked: "Today", or "Close". */
  todayLabel: string
}) {
  const last = points.length - 1
  const [index, setIndex] = useState<number | null>(null)
  const shown = index ?? last
  const point = points[shown]
  if (!point) return null

  function move(event: PointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect()
    if (box.width > 0) setIndex(nearest(points, (event.clientX - box.left) / box.width))
  }

  function key(event: KeyboardEvent<HTMLDivElement>) {
    const next = stepped(event.key, shown, last)
    if (next === null) return
    event.preventDefault()
    setIndex(next)
  }

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label={name}
      aria-valuemin={0}
      aria-valuemax={last}
      aria-valuenow={shown}
      aria-valuetext={point.label}
      onPointerMove={move}
      onPointerDown={move}
      onPointerLeave={() => setIndex(null)}
      onBlur={() => setIndex(null)}
      onKeyDown={key}
      className="absolute inset-0 touch-pan-y rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {/* The header (CH-21): read as the slider's value, so hidden from screen readers. */}
      <div
        data-header
        aria-hidden
        className="pointer-events-none absolute -top-4 left-0 max-w-full -translate-y-full"
      >
        <p className="truncate text-2xl leading-tight font-extrabold tabular-nums">{point.price}</p>
        <p className="truncate type-meta tabular-nums">
          <span className={cn('font-semibold', TRENDS[point.trend])}>{point.change}</span>
          <span className="text-muted-foreground">
            {' '}
            · {index === null ? todayLabel : point.date}
          </span>
        </p>
      </div>
      {index !== null && (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 w-px bg-foreground/30"
            style={{ left: `${point.x * 100}%` }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute size-2 -translate-1/2 rounded-full bg-foreground ring-2 ring-background"
            style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
          />
        </>
      )}
    </div>
  )
}
