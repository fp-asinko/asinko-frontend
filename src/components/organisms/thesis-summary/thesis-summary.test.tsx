import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { ThesisState } from './thesis-state'
import { ThesisSummary } from './thesis-summary'
import type { ThesisSummaryData } from './thesis-summary.types'

const thesis = (overrides: Partial<ThesisSummaryData> = {}): ThesisSummaryData => ({
  claim: 'BTC will close above $150K before December 2026',
  state: 'open',
  target: { direction: 'above', price: 150000 },
  deadline: '2026-12-31T12:00:00.000Z',
  conviction: 3,
  resolutionPrice: null,
  cancellationReason: null,
  ...overrides,
})

describe('ThesisSummary (specs/thesis-detail TD-03)', () => {
  it('draws the claim as the heading asked, the target and the conviction', () => {
    renderWithIntl(<ThesisSummary thesis={thesis()} titleId="t" heading="h1" />)
    expect(screen.getByRole('heading', { level: 1, name: /BTC will close above/ })).toHaveAttribute(
      'id',
      't',
    )
    expect(screen.getByText('Above $150,000 by Dec 31, 2026')).toBeInTheDocument()
    expect(screen.getByText('High').closest('p')).toHaveTextContent('Conviction')
  })

  it('says the price it resolved at, and why it was cancelled', () => {
    const { rerender } = renderWithIntl(
      <ThesisSummary thesis={thesis({ state: 'correct', resolutionPrice: 182.47 })} titleId="t" />,
    )
    expect(screen.getByText('Resolved at $182.47')).toBeInTheDocument()
    rerender(
      <ThesisSummary
        thesis={thesis({ state: 'cancelled', cancellationReason: 'Posted twice.', target: null })}
        titleId="t"
      />,
    )
    expect(screen.getByText('Cancelled: Posted twice.')).toBeInTheDocument()
    expect(screen.getByText('By Dec 31, 2026')).toBeInTheDocument()
  })
})

describe('ThesisState (specs/profile-track-record PT-07)', () => {
  it('names the state, with ✓ or ✗ when resolved: never the color alone', () => {
    const { rerender } = renderWithIntl(<ThesisState state="incorrect" />)
    expect(screen.getByText('Incorrect')).toHaveAttribute('data-state', 'incorrect')
    expect(screen.getByText('Incorrect').querySelector('svg')).not.toBeNull()
    rerender(<ThesisState state="expired" />)
    expect(screen.getByText('Expired').querySelector('svg')).toBeNull()
  })
})
