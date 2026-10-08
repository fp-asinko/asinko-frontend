import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import type { ThesisItem } from '../communities.types'
import { ThesisCard } from './thesis-card'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

const thesis = (overrides: Partial<ThesisItem> = {}): ThesisItem => ({
  id: 't1',
  asset: { symbol: 'BTC', path: '/asset/BTC' },
  claim: 'BTC will close above $150K before December 2026',
  state: 'open',
  target: { direction: 'above', price: 150000 },
  deadline: '2026-12-31T12:00:00.000Z',
  conviction: 3,
  resolutionPrice: null,
  cancellationReason: null,
  publishedAt: '2026-09-29T12:00:00.000Z',
  ...overrides,
})

describe('ThesisCard (specs/profile-track-record PT-07, PT-08)', () => {
  it('shows the asset, the claim as its title, the target and the conviction', () => {
    renderWithIntl(<ThesisCard thesis={thesis()} />)
    expect(screen.getByRole('link', { name: '$BTC' })).toHaveAttribute('href', '/asset/BTC')
    expect(
      screen.getByRole('article', { name: 'BTC will close above $150K before December 2026' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Above $150,000 by Dec 31, 2026')).toBeInTheDocument()
    expect(screen.getByText('Open')).toBeInTheDocument()
    expect(screen.getByText('High').closest('p')).toHaveTextContent('Conviction')
  })

  it('marks a correct thesis with ✓ and the price it resolved at, without votes', () => {
    renderWithIntl(<ThesisCard thesis={thesis({ state: 'correct', resolutionPrice: 182.47 })} />)
    const chip = screen.getByText('Correct')
    expect(chip).toHaveAttribute('data-state', 'correct')
    expect(chip.querySelector('svg')).not.toBeNull()
    expect(screen.getByText('Resolved at $182.47')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('keeps a qualitative thesis without asset nor price, and says why it was cancelled', () => {
    renderWithIntl(
      <ThesisCard
        thesis={thesis({
          asset: null,
          target: null,
          state: 'cancelled',
          cancellationReason: 'Posted twice by mistake.',
        })}
      />,
    )
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText('By Dec 31, 2026')).toBeInTheDocument()
    expect(screen.getByText('Cancelled: Posted twice by mistake.')).toBeInTheDocument()
  })

  it('formats prices and dates in the page language', () => {
    renderWithIntl(<ThesisCard thesis={thesis()} />, { locale: 'es' })
    expect(
      screen.getByText(/^Por encima de .*150\.000.* antes del 31 dic 2026$/),
    ).toBeInTheDocument()
  })

  it.each([
    ['open', 'Open', null],
    ['correct', 'Correct', 'check'],
    ['incorrect', 'Incorrect', 'x'],
    ['disputed', 'Disputed', null],
    ['expired', 'Expired', null],
    ['cancelled', 'Cancelled', null],
  ] as const)('names the %s state in its chip, with its mark', (state, label, icon) => {
    renderWithIntl(<ThesisCard thesis={thesis({ state })} />)
    const chip = screen.getByText(label)
    expect(chip).toHaveAttribute('data-state', state)
    const mark = chip.querySelector('svg')
    if (icon) expect(mark).toHaveClass(`lucide-${icon}`)
    else expect(mark).toBeNull()
  })
})
