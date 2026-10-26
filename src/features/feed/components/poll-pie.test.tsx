import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PollPie } from './poll-pie'

const OPTIONS = [
  { id: 'a', share: 0.6 },
  { id: 'b', share: 0.4 },
  { id: 'c', share: 0 },
]

describe('PollPie (specs/poll-pie)', () => {
  it('draws a slice per option with votes, decorative and entering once (PP-01, PP-05, PP-06)', () => {
    const { container } = render(<PollPie options={OPTIONS} active={null} onActive={vi.fn()} />)
    const svg = container.querySelector('svg')!
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveClass('animate-pie-in')
    expect(
      [...svg.querySelectorAll('[data-slice]')].map((s) => s.getAttribute('data-slice')),
    ).toEqual(['a', 'b'])
  })

  it('draws nothing without votes', () => {
    const { container } = render(
      <PollPie options={[{ id: 'a', share: null }]} active={null} onActive={vi.fn()} />,
    )
    expect(container.querySelector('svg')).toBeNull()
  })

  it('asks to highlight the slice touched, and nothing when the pointer leaves (PP-04)', () => {
    const onActive = vi.fn()
    const { container } = render(<PollPie options={OPTIONS} active={null} onActive={onActive} />)
    fireEvent.click(container.querySelector('[data-slice="b"]')!)
    expect(onActive).toHaveBeenLastCalledWith('b')
    fireEvent.pointerLeave(container.querySelector('svg')!)
    expect(onActive).toHaveBeenLastCalledWith(null)
  })
})
