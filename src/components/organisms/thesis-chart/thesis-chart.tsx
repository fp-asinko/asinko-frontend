import type { ReactNode } from 'react'
import { BearMark, BullMark } from '@/components/ui/stance-marks'
import { CHART_HEIGHT, CHART_WIDTH, levelPlace, type LevelPlace } from '@/lib/theses/chart-geometry'
import type { ChartGeometry } from '@/lib/theses/chart.types'
import { cn } from '@/lib/utils'
import { ChartScrub } from './chart-scrub'

/** The line's color by where it stands (CH-04): written whole for Tailwind. */
const TONES = {
  bullish: 'text-bullish',
  bearish: 'text-bearish',
  neutral: 'text-muted-foreground',
} as const

/** Today's tag on the price axis, in the line's color (CH-20): its text in the page's background,
 * which reads on the color in both themes. */
const TAGS = {
  bullish: 'bg-bullish text-background',
  bearish: 'bg-bearish text-background',
  neutral: 'bg-muted-foreground text-background',
} as const

/** The target's level in the bet's color, its animal beside its label (CH-03). */
const TARGETS = {
  above: {
    stroke: 'stroke-bullish',
    legend: 'border-bullish',
    tag: 'border-bullish text-bullish',
    mark: <BullMark className="size-3.5 text-bullish" />,
  },
  below: {
    stroke: 'stroke-bearish',
    legend: 'border-bearish',
    tag: 'border-bearish text-bearish',
    mark: <BearMark className="size-3.5 text-bearish" />,
  },
  equals: {
    stroke: 'stroke-foreground',
    legend: 'border-foreground',
    tag: 'border-foreground text-foreground',
    mark: null,
  },
} as const

/**
 * A level's label beside its line, HTML at a share of the box so the text does not stretch. No
 * background, so it covers nothing (PO, 2026-11-06): it goes on the side the price leaves free.
 */
function Level({ y, place, children }: { y: number; place: LevelPlace; children: ReactNode }) {
  return (
    <span
      data-side={place.side}
      data-end={place.end}
      className={cn(
        'absolute inline-flex items-center gap-1 type-caption whitespace-nowrap text-muted-foreground tabular-nums',
        place.side === 'above' ? '-translate-y-full pb-0.5' : 'pt-0.5',
        place.end === 'left' ? 'left-0' : 'right-0',
      )}
      style={{ top: `${y * 100}%` }}
    >
      {children}
    </span>
  )
}

/**
 * A thesis's chart (specs/thesis-chart CH-02 to CH-12): its price from its publication to today on
 * an axis that runs to its deadline, the entry and the target as levels, and a dashed projection
 * from today to the target. It draws itself once, left to right (Q1), with a mask that scales: only
 * `transform` moves (CH-09). A Server Component without business: the geometry and the words come
 * made; on top, `ChartScrub` lets it be walked day by day (CH-16).
 *
 * The drawing is one image with a name that says it all (CH-11): its parts are not read apart.
 */
export function ThesisChart({
  id,
  geometry,
  label,
  entry,
  target,
  todayPrice,
  entryPrice,
  targetPrice,
  ticks,
  live,
  axis,
  scrub,
}: {
  /** Ids from the thesis, not useId: on the server it can repeat a client component's. */
  id: string
  geometry: ChartGeometry
  /** What the chart says, for screen readers. */
  label: string
  entry: string
  target: { label: string; direction: 'above' | 'below' | 'equals' } | null
  todayPrice: string
  /** The entry's and the target's prices, as tags on the price axis (CH-20). */
  entryPrice: string
  targetPrice: string | null
  /** The price axis's labels, made on the server (CH-20). */
  ticks: string[]
  /** Open: today's dot keeps pulsing, live (CH-22). */
  live: boolean
  axis: { start: string; today: string; end: string }
  scrub: {
    name: string
    todayLabel: string
    points: {
      label: string
      price: string
      change: string
      trend: 'up' | 'down' | 'flat'
      date: string
    }[]
  }
}) {
  const fill = `chart-fill-${id}`
  const { today } = geometry
  const tone = TONES[geometry.tone]
  // Each level's label beside its line where the price leaves room; else in the legend (CH-03).
  const levels = [
    {
      key: 'entry',
      y: geometry.entryY,
      place: levelPlace(geometry, geometry.entryY, 'below'),
      dashed: false,
      stroke: 'border-input',
      content: entry,
    },
    ...(target && geometry.targetY !== null
      ? [
          {
            key: 'target',
            y: geometry.targetY,
            place: levelPlace(
              geometry,
              geometry.targetY,
              geometry.targetY < geometry.entryY ? 'above' : 'below',
            ),
            dashed: true,
            stroke: TARGETS[target.direction].legend,
            content: (
              <>
                {TARGETS[target.direction].mark}
                {target.label}
              </>
            ),
          },
        ]
      : []),
  ]
  const legend = levels.filter((level) => !level.place)
  // The price axis (CH-20): today's tag first, then the target's and the entry's where they do not
  // touch it, then the round prices where they touch none. Nothing said twice, nothing on top.
  const clear = (y: number, taken: number[]) => taken.every((other) => Math.abs(other - y) > 0.1)
  const tags: { key: string; y: number; text: string; className: string }[] = [
    { key: 'today', y: today.y, text: todayPrice, className: cn('font-bold', TAGS[geometry.tone]) },
  ]
  if (
    target &&
    targetPrice !== null &&
    geometry.targetY !== null &&
    clear(geometry.targetY, [today.y])
  ) {
    tags.push({
      key: 'target',
      y: geometry.targetY,
      text: targetPrice,
      className: cn('border bg-background font-semibold', TARGETS[target.direction].tag),
    })
  }
  if (
    clear(
      geometry.entryY,
      tags.map((tag) => tag.y),
    )
  ) {
    tags.push({
      key: 'entry',
      y: geometry.entryY,
      text: entryPrice,
      className: 'border border-input bg-background text-muted-foreground',
    })
  }
  const axis_ = geometry.ticks
    .map((tick, index) => ({ ...tick, label: ticks[index] ?? '' }))
    .filter(
      (tick) =>
        tick.y > 0.04 &&
        tick.y < 0.96 &&
        clear(
          tick.y,
          tags.map((tag) => tag.y),
        ),
    )

  return (
    // Room on top for the header, a broker's (ChartScrub, CH-21); on the right, the price axis.
    <div data-chart className="rounded-xl border bg-background p-3 pt-18">
      <div className="relative">
        {/* The price axis (CH-20): round prices and today's tag, outside the drawing. */}
        <div aria-hidden className="absolute inset-y-0 right-0 w-16 type-caption tabular-nums">
          {axis_.map((tick) => (
            <span
              key={tick.price}
              className="absolute left-2 -translate-y-1/2 whitespace-nowrap text-muted-foreground"
              style={{ top: `${tick.y * 100}%` }}
            >
              {tick.label}
            </span>
          ))}
          {tags.map((tag) => (
            <span
              key={tag.key}
              data-tag={tag.key}
              {...(tag.key === 'today' ? { 'data-today-tag': '' } : {})}
              className={cn(
                'absolute left-1 -translate-y-1/2 rounded-sm px-1.5 py-0.5 whitespace-nowrap',
                tag.key === 'today' && 'animate-chart-dot',
                tag.className,
              )}
              style={{ top: `${tag.y * 100}%` }}
            >
              {tag.text}
            </span>
          ))}
        </div>
        <div className="relative mr-16 h-44 sm:h-60">
          {/* The labels with no room beside their lines, each with a stroke of its line's style. */}
          {legend.length > 0 && (
            <div
              data-legend
              className="absolute -top-4 right-0 flex -translate-y-full items-center gap-3 py-1 type-caption whitespace-nowrap text-muted-foreground tabular-nums"
            >
              {legend.map((level) => (
                <span key={level.key} className="inline-flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className={cn(
                      'w-3 border-t',
                      level.dashed ? 'border-dashed' : 'border-solid',
                      level.stroke,
                    )}
                  />
                  {level.content}
                </span>
              ))}
            </div>
          )}
          <div role="img" aria-label={label} className="absolute inset-0">
            <svg
              viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
              preserveAspectRatio="none"
              className={cn('absolute inset-0 size-full overflow-visible', tone)}
            >
              {/* The grid, faint: one line per price on the axis (CH-20). */}
              {geometry.ticks.map((tick) => (
                <line
                  key={tick.price}
                  data-grid
                  x1="0"
                  x2={CHART_WIDTH}
                  y1={tick.y * CHART_HEIGHT}
                  y2={tick.y * CHART_HEIGHT}
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                  className="stroke-border"
                />
              ))}
              <line
                data-level="entry"
                x1="0"
                x2={CHART_WIDTH}
                y1={geometry.entryY * CHART_HEIGHT}
                y2={geometry.entryY * CHART_HEIGHT}
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
                // --input: 3:1 against the background, as a line that says something must (CH-11).
                className="stroke-input"
              />
              {target && geometry.targetY !== null && (
                <line
                  data-level="target"
                  x1="0"
                  x2={CHART_WIDTH}
                  y1={geometry.targetY * CHART_HEIGHT}
                  y2={geometry.targetY * CHART_HEIGHT}
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  vectorEffect="non-scaling-stroke"
                  className={TARGETS[target.direction].stroke}
                />
              )}
              {geometry.projection && (
                <path
                  data-projection
                  d={geometry.projection}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  vectorEffect="non-scaling-stroke"
                  className={cn('animate-chart-fade', tone)}
                />
              )}
            </svg>

            {/* Its area fades in while the line draws, so no hard edge sweeps across (CH-08). */}
            <div aria-hidden className="absolute inset-0 animate-chart-area">
              <svg
                viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                preserveAspectRatio="none"
                // The tone on the root: the gradient's stops take currentColor from here.
                className={cn('absolute inset-0 size-full overflow-visible', tone)}
              >
                <defs>
                  <linearGradient id={fill} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="currentColor" stopOpacity="0.15" />
                    <stop offset="1" stopColor="currentColor" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={geometry.area} fill={`url(#${fill})`} />
              </svg>
            </div>
            {/* The line, in a layer of its own that a clip-path uncovers left to right at a steady
              pace (CH-08, CH-09): no SVG mask, which repaints every frame and stuttered. */}
            <div
              data-draw
              className="absolute inset-0 animate-chart-draw"
              // Where it stops: today, so the whole 1.6 s draws the line (a hair past it, for its cap).
              style={{ ['--chart-rest' as string]: `${Math.max(0, (1 - today.x) * 100 - 1)}%` }}
            >
              <svg
                viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                preserveAspectRatio="none"
                // The tone on the root: the gradient's stops take currentColor from here.
                className={cn('absolute inset-0 size-full overflow-visible', tone)}
                data-tone={geometry.tone}
              >
                <path
                  d={geometry.line}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>

            {/* The entry below its line; the target on the side away from it (outside the prices). */}
            {levels.map(
              (level) =>
                level.place && (
                  <Level key={level.key} y={level.y} place={level.place}>
                    {level.content}
                  </Level>
                ),
            )}

            {/* Today: a dot that pulses while open, live (CH-08, CH-22); its price on the axis. */}
            <span
              data-today
              className="absolute origin-top-left animate-chart-dot"
              style={{ left: `${today.x * 100}%`, top: `${today.y * 100}%` }}
            >
              <span
                className={cn(
                  'absolute size-2 -translate-1/2 rounded-full bg-current ring-2 ring-background',
                  tone,
                )}
              />
              {live && (
                <span
                  className={cn(
                    'absolute size-2 -translate-1/2 animate-chart-pulse rounded-full bg-current opacity-0',
                    tone,
                  )}
                />
              )}
            </span>
          </div>

          <ChartScrub
            name={scrub.name}
            todayLabel={scrub.todayLabel}
            points={geometry.points.map((point, index) => ({
              x: point.x,
              y: point.y,
              label: scrub.points[index]?.label ?? '',
              price: scrub.points[index]?.price ?? '',
              change: scrub.points[index]?.change ?? '',
              trend: scrub.points[index]?.trend ?? 'flat',
              date: scrub.points[index]?.date ?? '',
            }))}
          />
        </div>
      </div>

      {/* The publication, today and the deadline (Q2); the image's name already says them. */}
      <div aria-hidden className="relative mt-2 mr-16 h-4 type-caption text-muted-foreground">
        <span className="absolute left-0">{axis.start}</span>
        {/* Only with room on both sides, so it never runs into the dates at the edges. */}
        {today.x > 0.3 && today.x < 0.8 && (
          <span className="absolute -translate-x-1/2" style={{ left: `${today.x * 100}%` }}>
            {axis.today}
          </span>
        )}
        <span className="absolute right-0">{axis.end}</span>
      </div>
    </div>
  )
}
