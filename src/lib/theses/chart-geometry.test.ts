// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { chartGeometry, levelPlace, niceTicks } from './chart-geometry'

const day = (n: number) => new Date(Date.UTC(2026, 9, 1 + n)).toISOString()
const base = {
  points: [
    { at: day(0), price: 100 },
    { at: day(5), price: 110 },
    { at: day(10), price: 120 },
  ],
  entry: 100,
  target: { direction: 'above' as const, price: 150 },
  start: day(0),
  end: day(20),
  closed: false,
}

describe('chartGeometry (specs/thesis-chart)', () => {
  it('runs from the publication to the deadline (Q2, CH-02)', () => {
    const late = { ...base, end: day(14) }
    const chart = chartGeometry(late)!
    // Today at 10 of 14 days: one scale, as the time goes.
    expect(chart.today.x).toBeCloseTo(10 / 14)
    expect(chart.points[1]!.x).toBeCloseTo(5 / 14)
  })

  it('gives what happened at least 60 % of the width when today is early', () => {
    const chart = chartGeometry(base)!
    // Halfway in time, but drawn to 60 %: the rest squeezes the time left.
    expect(chart.points.map((each) => each.x)).toEqual([0, 0.3, 0.6])
    expect(chart.line).toBe('M 0 279.3 L 300 227.6 L 600 175.9')
    expect(chart.area.endsWith('L 600 300 L 0 300 Z')).toBe(true)
  })

  it('keeps the entry and the target inside, with room at the edges (CH-03)', () => {
    const chart = chartGeometry(base)!
    expect(chart.targetY).toBeGreaterThan(0)
    expect(chart.entryY).toBeLessThan(1)
    // Higher prices are higher up.
    expect(chart.targetY!).toBeLessThan(chart.entryY)
  })

  it('projects from today to the target at the deadline, while open (CH-02, CH-05)', () => {
    const open = chartGeometry(base)!
    expect(open.projection).toBe('M 600 175.9 L 1000 20.7')
    expect(chartGeometry({ ...base, closed: true })!.projection).toBeNull()
    expect(
      chartGeometry({ ...base, target: { direction: 'equals', price: 150 } })!.projection,
    ).toBeNull()
  })

  it('takes the bet’s color on the target’s side, gray against it (CH-04)', () => {
    expect(chartGeometry(base)!.tone).toBe('bullish')
    const against = { ...base, points: [...base.points, { at: day(11), price: 95 }] }
    expect(chartGeometry(against)!.tone).toBe('neutral')
    const bearish = { ...against, target: { direction: 'below' as const, price: 80 } }
    expect(chartGeometry(bearish)!.tone).toBe('bearish')
    expect(chartGeometry({ ...base, target: null })!.tone).toBe('neutral')
  })

  it('has nothing to draw under two points or without an axis (CH-06)', () => {
    expect(chartGeometry({ ...base, points: base.points.slice(0, 1) })).toBeNull()
    expect(chartGeometry({ ...base, end: base.start })).toBeNull()
  })

  it('keeps a point past the deadline at its edge', () => {
    const late = chartGeometry({ ...base, points: [...base.points, { at: day(30), price: 130 }] })!
    expect(late.today.x).toBe(1)
  })
})

describe('levelPlace (specs/thesis-chart CH-03)', () => {
  const at = (x: number, y: number) => ({ x, y, at: '', price: 0 })
  const chart = (points: ReturnType<typeof at>[], projection = false) => ({
    points,
    today: points.at(-1)!,
    targetY: 0.1,
    projection: projection ? 'M' : null,
  })

  it('keeps the place it prefers when the price leaves it free', () => {
    expect(levelPlace(chart([at(0, 0.5), at(0.5, 0.3)]), 0.5, 'below')).toEqual({
      side: 'below',
      end: 'left',
    })
  })

  it('goes above when the price passes under its label', () => {
    expect(levelPlace(chart([at(0, 0.5), at(0.1, 0.56), at(0.5, 0.3)]), 0.5, 'below')).toEqual({
      side: 'above',
      end: 'left',
    })
  })

  it('goes to the right end when both sides at the left are crossed', () => {
    const crowded = chart([at(0, 0.5), at(0.1, 0.56), at(0.15, 0.44), at(0.5, 0.45)], true)
    // The projection climbs to the target: below the line at the right is free.
    expect(levelPlace(crowded, 0.5, 'below')).toEqual({ side: 'below', end: 'right' })
  })

  it('gives up when nothing is free: the label goes to the legend', () => {
    const crowded = chart([
      at(0, 0.5),
      at(0.1, 0.56),
      at(0.15, 0.44),
      at(0.9, 0.56),
      at(0.95, 0.44),
    ])
    expect(levelPlace(crowded, 0.5, 'below')).toBeNull()
  })

  it('stays inside the box: a level at the bottom takes its label above', () => {
    expect(levelPlace(chart([at(0, 0.5), at(0.5, 0.3)]), 0.95, 'below')?.side).toBe('above')
  })
})

describe('niceTicks (specs/thesis-chart CH-20)', () => {
  it('steps by 1, 2 or 5 times a power of ten, inside the range', () => {
    expect(niceTicks(78_000, 165_000)).toEqual([80_000, 100_000, 120_000, 140_000, 160_000])
    expect(niceTicks(0.9, 1.6)).toEqual([1, 1.2, 1.4, 1.6])
    expect(niceTicks(5, 5)).toEqual([])
  })

  it('gives the chart its axis, high prices on top', () => {
    const chart = chartGeometry(base)!
    expect(chart.ticks.length).toBeGreaterThanOrEqual(3)
    const [lowest, highest] = [chart.ticks[0]!, chart.ticks.at(-1)!]
    expect(highest.price).toBeGreaterThan(lowest.price)
    expect(highest.y).toBeLessThan(lowest.y)
  })
})
