import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ChartScrub } from './chart-scrub'

const point = (x: number, y: number, date: string, price: string, change: string) => ({
  x,
  y,
  label: `${date} · ${price} · ${change} from entry`,
  price,
  change: `${change} since entry`,
  trend: change.startsWith('+') ? ('up' as const) : ('flat' as const),
  date,
})
const POINTS = [
  point(0, 0.5, 'Oct 1', '$100', '0%'),
  point(0.25, 0.4, 'Oct 6', '$110', '+10%'),
  point(0.5, 0.3, 'Oct 11', '$120', '+20%'),
]

const renderScrub = () =>
  render(<ChartScrub name="NVDA price by day" points={POINTS} todayLabel="Today" />)
const header = (container: HTMLElement) => container.querySelector('[data-header]')
const slider = () => screen.getByRole('slider', { name: 'NVDA price by day' })

describe('ChartScrub (specs/thesis-chart CH-16 to CH-19)', () => {
  it('says today’s point until walked, and draws nothing over the chart (CH-19)', () => {
    const { container } = renderScrub()
    expect(slider()).toHaveAttribute('aria-valuenow', '2')
    expect(slider()).toHaveAttribute('aria-valuetext', 'Oct 11 · $120 · +20% from entry')
    // A broker's header: today's price and its change since the entry (CH-21).
    expect(header(container)).toHaveTextContent('$120+20% since entry · Today')
    expect(header(container)?.querySelector('.text-bullish')).toHaveTextContent('+20% since entry')
  })

  it('walks day by day with the keyboard: ← →, Home and End (CH-17)', async () => {
    const { container } = renderScrub()
    await userEvent.tab()
    expect(slider()).toHaveFocus()
    await userEvent.keyboard('{ArrowLeft}')
    expect(slider()).toHaveAttribute('aria-valuetext', 'Oct 6 · $110 · +10% from entry')
    expect(header(container)).toHaveTextContent('$110+10% since entry · Oct 6')
    await userEvent.keyboard('{Home}')
    expect(slider()).toHaveAttribute('aria-valuenow', '0')
    await userEvent.keyboard('{ArrowLeft}')
    expect(slider()).toHaveAttribute('aria-valuenow', '0')
    await userEvent.keyboard('{End}')
    expect(slider()).toHaveAttribute('aria-valuenow', '2')
  })

  it('follows the pointer to the nearest day, and goes back to today when it leaves (CH-16)', () => {
    const { container } = renderScrub()
    const box = slider()
    box.getBoundingClientRect = () => ({ left: 0, width: 400, top: 0, height: 100 }) as DOMRect
    // 30 % of the way: nearest to the second point (25 %).
    fireEvent.pointerMove(box, { clientX: 120 })
    expect(box).toHaveAttribute('aria-valuenow', '1')
    expect(header(container)).toHaveTextContent('$110+10% since entry · Oct 6')
    fireEvent.pointerLeave(box)
    expect(box).toHaveAttribute('aria-valuenow', '2')
    expect(header(container)).toHaveTextContent('$120+20% since entry · Today')
  })

  it('lets a vertical drag scroll the page (CH-18)', () => {
    renderScrub()
    expect(slider()).toHaveClass('touch-pan-y')
  })
})
