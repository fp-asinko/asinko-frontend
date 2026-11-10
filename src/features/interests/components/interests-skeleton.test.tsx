import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { InterestsSkeleton } from './interests-skeleton'

describe('InterestsSkeleton (FN-08)', () => {
  it('holds the column while it loads, hidden from screen readers', () => {
    render(<InterestsSkeleton />)
    expect(screen.getByTestId('interests-skeleton')).toHaveAttribute('aria-hidden', 'true')
  })

  it("has the column's sections in its order, suggested last (specs/sidebar-fill SF-01)", () => {
    render(<InterestsSkeleton />)
    const sections = [
      ...screen.getByTestId('interests-skeleton').querySelectorAll('[data-section]'),
    ].map((el) => el.getAttribute('data-section'))
    expect(sections).toEqual(['groups', 'people', 'assets', 'suggested'])
  })

  it('draws the assets as a grid of six tiles, as the real ones', () => {
    render(<InterestsSkeleton />)
    const assets = screen.getByTestId('interests-skeleton').querySelector('[data-section=assets]')
    expect(assets?.querySelector('.grid')?.children).toHaveLength(6)
  })
})
