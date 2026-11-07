import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { chartGeometry } from '@/lib/theses/chart-geometry'
import { renderWithIntl } from '@/test/render-with-intl'
import { ThesisChart } from './thesis-chart'

const day = (n: number) => new Date(Date.UTC(2026, 9, 1 + n)).toISOString()
const geometry = (
  closed = false,
  target: { direction: 'above' | 'below'; price: number } | null = {
    direction: 'above',
    price: 150,
  },
  last = 120,
) =>
  chartGeometry({
    points: [
      { at: day(0), price: 100 },
      { at: day(5), price: 110 },
      { at: day(10), price: last },
    ],
    entry: 100,
    target,
    start: day(0),
    end: day(20),
    closed,
  })!

const render = (closed = false) =>
  renderWithIntl(
    <ThesisChart
      id="t1"
      geometry={geometry(closed)}
      label="Price of NVDA since Oct 1: from $100 to $120 today; target $150 by Oct 21"
      entry="Entry"
      entryPrice="$100"
      target={{ label: 'Target', direction: 'above' }}
      targetPrice="$150"
      todayPrice="$120"
      axis={{ start: 'Oct 1', today: 'Today', end: 'Oct 21' }}
      ticks={['$100', '$120', '$140']}
      live={!closed}
      scrub={{
        name: 'NVDA price by day',
        todayLabel: 'Today',
        points: ['a', 'b', 'c'].map((label) => ({
          label,
          price: `${label}`,
          change: '+20% since entry',
          trend: 'up' as const,
          date: label,
        })),
      }}
    />,
  )

describe('ThesisChart (specs/thesis-chart)', () => {
  it('is one image named by what it says, walkable as a slider (CH-11, CH-17)', () => {
    render()
    expect(
      screen.getByRole('img', { name: /^Price of NVDA since Oct 1: from \$100 to \$120 today/ }),
    ).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: 'NVDA price by day' })).toHaveAttribute(
      'aria-valuetext',
      'c',
    )
  })

  it('draws the entry and the target with their labels, and today’s price (CH-03)', () => {
    const { container } = render()
    expect(container.querySelector('[data-level="entry"]')).not.toBeNull()
    expect(container.querySelector('[data-level="target"]')).not.toBeNull()
    // The words on the lines; the prices as tags on the axis (CH-20).
    expect(screen.getByText('Entry')).toBeInTheDocument()
    expect(screen.getByText('Target')).toBeInTheDocument()
    expect(container.querySelector('[data-tag="entry"]')).toHaveTextContent('$100')
    expect(container.querySelector('[data-tag="target"]')).toHaveTextContent('$150')
    expect(container.querySelector('[data-tag="today"]')).toHaveTextContent('$120')
    // The bull beside a bullish target (specs/thesis-agree AG-19).
    expect(container.querySelector('[data-mark="bull"]')).not.toBeNull()
  })

  it('takes the bet’s tone on the target’s side (CH-04)', () => {
    const { container } = render()
    expect(container.querySelector('[data-tone]')).toHaveAttribute('data-tone', 'bullish')
  })

  it('projects to the target while open, and not closed (CH-02, CH-05)', () => {
    const { container, unmount } = render()
    expect(container.querySelector('[data-projection]')).not.toBeNull()
    unmount()
    const closed = render(true)
    expect(closed.container.querySelector('[data-projection]')).toBeNull()
  })

  it('uncovers the price in a layer of its own, the levels there from the start (CH-08, CH-09)', () => {
    const { container } = render()
    const draw = container.querySelector('[data-draw]')!
    expect(draw).toHaveClass('animate-chart-draw')
    expect(draw.querySelector('[data-tone]')).not.toBeNull()
    // Its area fades in apart, its gradient's id from the thesis.
    expect(
      container.querySelector('.animate-chart-area linearGradient#chart-fill-t1'),
    ).not.toBeNull()
    // The entry and the target are not inside the layer that draws itself.
    expect(draw.querySelector('[data-level]')).toBeNull()
  })

  it('goes gray against its bet, and shows the bear for a bearish one (CH-03, CH-04)', () => {
    const { container } = renderWithIntl(
      <ThesisChart
        id="t2"
        geometry={geometry(false, { direction: 'below', price: 80 }, 120)}
        label="Price"
        entry="Entry"
        entryPrice="$100"
        target={{ label: 'Target', direction: 'below' }}
        targetPrice="$80"
        todayPrice="$120"
        axis={{ start: 'Oct 1', today: 'Today', end: 'Oct 21' }}
        ticks={[]}
        live
        scrub={{ name: 'Walk', todayLabel: 'Today', points: [] }}
      />,
    )
    expect(container.querySelector('[data-tone]')).toHaveAttribute('data-tone', 'neutral')
    expect(container.querySelector('[data-mark="bear"]')).not.toBeNull()
  })

  it('draws only the line and the entry without a target to aim at (CH-07)', () => {
    const { container } = renderWithIntl(
      <ThesisChart
        id="t3"
        geometry={geometry(false, null)}
        label="Price"
        entry="Entry"
        entryPrice="$100"
        target={null}
        targetPrice={null}
        todayPrice="$120"
        axis={{ start: 'Oct 1', today: 'Today', end: 'Oct 21' }}
        ticks={[]}
        live
        scrub={{ name: 'Walk', todayLabel: 'Today', points: [] }}
      />,
    )
    expect(container.querySelector('[data-level="target"]')).toBeNull()
    expect(container.querySelector('[data-projection]')).toBeNull()
    expect(screen.getByText('Entry')).toBeInTheDocument()
  })

  it('has a price axis with a faint grid and today’s tag in the line’s tone (CH-20)', () => {
    const { container } = render()
    expect(container.querySelectorAll('[data-grid]').length).toBeGreaterThanOrEqual(3)
    const tag = container.querySelector('[data-today-tag]')!
    expect(tag).toHaveTextContent('$120')
    expect(tag).toHaveClass('bg-bullish')
  })

  it('keeps today’s dot pulsing while open, and still once closed (CH-22)', () => {
    const { container, unmount } = render()
    expect(container.querySelector('.animate-chart-pulse')).not.toBeNull()
    unmount()
    const closed = render(true)
    expect(closed.container.querySelector('.animate-chart-pulse')).toBeNull()
  })

  it('marks the publication, today and the deadline on its axis (Q2)', () => {
    render()
    for (const text of ['Oct 1', 'Today', 'Oct 21']) {
      expect(screen.getByText(text)).toBeInTheDocument()
    }
  })
})
