import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { thesisItem } from '../feed-items.fixture'
import { ThesisBet } from './thesis-bet'

const standing = () => document.querySelector('[data-standing]')

describe('ThesisBet (specs/thesis-detail TD-07, TD-08)', () => {
  it('says what it bets on: reference, target with its distance, deadline, conviction and when', () => {
    renderWithIntl(<ThesisBet thesis={thesisItem()} />)
    expect(screen.getByRole('heading', { name: 'The bet' })).toBeInTheDocument()
    expect(screen.getByText('$83,584, on Oct 13, 2026')).toBeInTheDocument()
    // Green up, with its arrow and its words: never the color alone.
    const target = screen.getByText(/^Above \$150,000 · \+79\.5%$/)
    expect(target).toHaveClass('text-bullish')
    expect(target.querySelector('svg')).not.toBeNull()
    expect(screen.getByText('Deadline').nextElementSibling).toHaveTextContent(/\d{1,2}:\d{2}/)
    expect(screen.getByText('High')).toBeInTheDocument()
    expect(standing()).toHaveTextContent(/^Closes in /)
  })

  it('says a bet below in red, and one without price as such', () => {
    renderWithIntl(
      <ThesisBet
        thesis={thesisItem({ target: { direction: 'below', price: 60000 }, reference: null })}
      />,
    )
    expect(screen.getByText('Below $60,000')).toHaveClass('text-bearish')
    expect(screen.getByText('No price')).toBeInTheDocument()
  })

  it('says where each state stands', () => {
    const at = '2026-12-03T23:59:59.000Z'
    const cases = [
      [{ state: 'expired' }, 'Waiting for resolution'],
      [{ state: 'disputed' }, 'Under review'],
      [
        { state: 'correct', resolution: { price: 162000, at, source: 'automatic' } },
        /^Correct on Dec \d, 2026 at \$162,000 · automatically$/,
      ],
      [
        { state: 'incorrect', resolution: { price: null, at, source: 'community' } },
        /^Incorrect on Dec \d, 2026 · by the community$/,
      ],
      [
        { state: 'cancelled', cancellation: { at, reason: 'Wrong asset.' } },
        /^Cancelled on Dec \d, 2026: Wrong asset\.$/,
      ],
    ] as const
    for (const [changes, text] of cases) {
      const { unmount } = renderWithIntl(<ThesisBet thesis={thesisItem(changes)} />)
      expect(standing()).toHaveTextContent(text)
      unmount()
    }
  })

  it('marks a resolved one with ✓ or ✗ beside its words', () => {
    renderWithIntl(
      <ThesisBet
        thesis={thesisItem({
          state: 'incorrect',
          resolution: { price: 1, at: '2026-12-03T12:00:00.000Z', source: 'admin' },
        })}
      />,
    )
    expect(standing()?.querySelector('svg')).not.toBeNull()
  })
})
