/** One price of an asset's history (P-046, specs/thesis-chart). */
export type PricePoint = { at: string; price: number }

/** The line's color (CH-04): the bet's while on the target's side of the entry, else gray. */
export type ChartTone = 'bullish' | 'bearish' | 'neutral'

/** A point of the chart: where it goes (0 to 1, x from the left, y from the top) and what it is. */
export type ChartPoint = { x: number; y: number; at: string; price: number }

/** What the chart draws, in a 1000 × 300 viewBox (specs/thesis-chart § 2). */
export type ChartGeometry = {
  line: string
  area: string
  /** Today → the target at the deadline (CH-02); null closed, or without a target to aim at. */
  projection: string | null
  entryY: number
  targetY: number | null
  /** Where "today" falls on the x axis: the last point. */
  today: ChartPoint
  points: ChartPoint[]
  tone: ChartTone
  /** The price axis (specs/thesis-chart CH-20): round prices inside the box, and where they fall. */
  ticks: { y: number; price: number }[]
}
