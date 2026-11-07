import type { ChartGeometry, ChartTone, PricePoint } from './chart.types'

export const CHART_WIDTH = 1000
export const CHART_HEIGHT = 300
/** Room above and below the prices, the entry and the target, so the lines never touch an edge. */
const PADDING = 0.08
/**
 * The least of the width what has happened takes: a thesis a year long, three weeks in, would
 * otherwise draw its line in a sliver at the left. Past it, the time to the deadline is squeezed
 * into the rest; "Today" on the axis marks where the scale changes.
 */
const PAST_MIN = 0.6

type Input = {
  points: readonly PricePoint[]
  entry: number
  target: { direction: 'above' | 'below' | 'equals'; price: number } | null
  /** Where the x axis starts and ends (Q2): its publication and its deadline. */
  start: string
  end: string
  /** Closed: no projection to the target (CH-05). */
  closed: boolean
}

const round = (value: number) => Math.round(value * 10) / 10

/**
 * The chart of a thesis (specs/thesis-chart CH-02 to CH-07): its price from its publication to
 * today on an axis that runs to its deadline, the entry and the target as levels, and a projection
 * from today to the target. null when there is nothing to draw: under two points, or an axis
 * without length.
 */
export function chartGeometry({
  points,
  entry,
  target,
  start,
  end,
  closed,
}: Input): ChartGeometry | null {
  const from = Date.parse(start)
  const to = Date.parse(end)
  if (points.length < 2 || !(to > from) || !(entry > 0)) return null

  const aim = target && target.direction !== 'equals' ? target : null
  const prices = [...points.map((each) => each.price), entry, ...(target ? [target.price] : [])]
  const low = Math.min(...prices)
  const high = Math.max(...prices)
  const span = high - low || high || 1
  const top = high + span * PADDING
  const bottom = low - span * PADDING

  // Two stretches when today is early (PAST_MIN): what happened, and what is left to the deadline.
  const now = Math.min(to, Date.parse(points.at(-1)!.at))
  const past = (now - from) / (to - from)
  const split = Math.max(past, PAST_MIN)
  const xOf = (at: string) => {
    const time = Math.min(to, Math.max(from, Date.parse(at)))
    if (split === past || now <= from) return (time - from) / (to - from)
    if (time <= now) return ((time - from) / (now - from)) * split
    return split + ((time - now) / (to - now)) * (1 - split)
  }
  const yOf = (price: number) => (top - price) / (top - bottom)

  const mapped = points.map((each) => ({ ...each, x: xOf(each.at), y: yOf(each.price) }))
  const today = mapped.at(-1)!
  const coords = mapped.map(
    (each) => `${round(each.x * CHART_WIDTH)} ${round(each.y * CHART_HEIGHT)}`,
  )
  const line = `M ${coords.join(' L ')}`
  const first = mapped[0]!
  const area = `${line} L ${round(today.x * CHART_WIDTH)} ${CHART_HEIGHT} L ${round(first.x * CHART_WIDTH)} ${CHART_HEIGHT} Z`

  const targetY = target ? yOf(target.price) : null
  const projection =
    !closed && aim && targetY !== null
      ? `M ${round(today.x * CHART_WIDTH)} ${round(today.y * CHART_HEIGHT)} L ${CHART_WIDTH} ${round(targetY * CHART_HEIGHT)}`
      : null

  return {
    line,
    area,
    projection,
    entryY: yOf(entry),
    targetY,
    today,
    points: mapped,
    tone: toneOf(aim, today.price, entry),
    ticks: niceTicks(bottom, top).map((price) => ({ price, y: yOf(price) })),
  }
}

/**
 * Three or four round prices between `low` and `high` for the price axis (CH-20), a broker's:
 * a step of 1, 2 or 5 times a power of ten.
 */
export function niceTicks(low: number, high: number): number[] {
  const span = high - low
  if (!(span > 0)) return []
  const rough = span / 3
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const scaled = rough / magnitude
  const step = (scaled < 1.5 ? 1 : scaled < 3 ? 2 : scaled < 7 ? 5 : 10) * magnitude
  const ticks: number[] = []
  for (let price = Math.ceil(low / step) * step; price <= high; price += step) {
    // Rounded to the step's precision: 6 × 0.2 is 1.2000000000000002 in floating point.
    ticks.push(Number((Math.round(price / step) * step).toPrecision(12)))
  }
  return ticks
}

/** The bet's color while the price is on its target's side of the entry (CH-04). */
function toneOf(aim: Input['target'], price: number, entry: number): ChartTone {
  if (!aim) return 'neutral'
  if (aim.direction === 'above') return price >= entry ? 'bullish' : 'neutral'
  return price <= entry ? 'bearish' : 'neutral'
}

/** The room a level's label takes, as shares of the box: its width and its height. */
const LABEL_WIDTH = 0.18
const LABEL_HEIGHT = 0.12

export type LevelPlace = { side: 'above' | 'below'; end: 'left' | 'right' }

/**
 * Where a level's label goes (specs/thesis-chart CH-03, PO 2026-11-06). Without a background, so
 * it covers nothing; the line must not cross it either. It tries, in order, below and above its
 * line at the left, then at the right, where only the projection runs (the future has no price),
 * and takes the first place that is free and inside the box. None free: null, and the label goes to
 * the chart's legend, where it covers nothing.
 */
export function levelPlace(
  geometry: Pick<ChartGeometry, 'points' | 'today' | 'targetY'> & { projection: string | null },
  y: number,
  prefer: 'above' | 'below',
): LevelPlace | null {
  const { points, today, targetY } = geometry
  // What runs through the box: the price, and the projection from today to the target.
  const marks = [...points]
  if (geometry.projection && targetY !== null) {
    for (let step = 1; step <= 20; step++) {
      const t = step / 20
      marks.push({ ...today, x: today.x + (1 - today.x) * t, y: today.y + (targetY - today.y) * t })
    }
  }
  const other = prefer === 'below' ? 'above' : 'below'
  const places: LevelPlace[] = [
    { side: prefer, end: 'left' },
    { side: other, end: 'left' },
    { side: prefer, end: 'right' },
    { side: other, end: 'right' },
  ]
  const fits = ({ side }: LevelPlace) =>
    side === 'below' ? y + LABEL_HEIGHT <= 1 : y - LABEL_HEIGHT >= 0
  const crossings = ({ side, end }: LevelPlace) =>
    marks.filter(
      (mark) =>
        (end === 'left' ? mark.x <= LABEL_WIDTH : mark.x >= 1 - LABEL_WIDTH) &&
        (side === 'below'
          ? mark.y > y && mark.y < y + LABEL_HEIGHT
          : mark.y < y && mark.y > y - LABEL_HEIGHT),
    ).length
  return places.find((place) => fits(place) && crossings(place) === 0) ?? null
}
