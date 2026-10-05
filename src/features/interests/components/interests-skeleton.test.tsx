import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { InterestsSkeleton } from './interests-skeleton'

describe('InterestsSkeleton (FN-08)', () => {
  it('holds the column while it loads, hidden from screen readers', () => {
    render(<InterestsSkeleton />)
    expect(screen.getByTestId('interests-skeleton')).toHaveAttribute('aria-hidden', 'true')
  })
})
