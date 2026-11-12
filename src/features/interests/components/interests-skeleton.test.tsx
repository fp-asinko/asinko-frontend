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

  it('draws the assets as five rows of the real height, with no grid (SA-11)', () => {
    render(<InterestsSkeleton />)
    const assets = screen.getByTestId('interests-skeleton').querySelector('[data-section=assets]')
    expect(assets?.querySelector('.grid')).toBeNull()
    const rows = assets?.querySelectorAll('.min-h-8') ?? []
    expect(rows).toHaveLength(5)
    // A round logo, the symbol, the price and the change, as the real row.
    expect(rows[0]?.children).toHaveLength(4)
    expect(rows[0]?.firstElementChild).toHaveClass('size-6', 'rounded-full')
  })

  it('holds the minimums: 3 groups and 3 people (SF-03, PO 2026-11-12)', () => {
    render(<InterestsSkeleton />)
    const root = screen.getByTestId('interests-skeleton')
    expect(root.querySelectorAll('[data-section=groups] .size-8')).toHaveLength(3)
    expect(root.querySelectorAll('[data-section=people] .size-8')).toHaveLength(3)
  })

  it('has no standalone "Create group" placeholder below the groups (it lives in the header)', () => {
    render(<InterestsSkeleton />)
    const groups = screen.getByTestId('interests-skeleton').querySelector('[data-section=groups]')
    expect(groups?.nextElementSibling?.getAttribute('data-section')).toBe('people')
  })
})
