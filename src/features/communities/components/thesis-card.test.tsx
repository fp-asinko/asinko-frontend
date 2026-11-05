import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FeaturedMenuContext } from '@/components/organisms/featured'
import { renderWithIntl } from '@/test/render-with-intl'
import type { ThesisItem } from '../communities.types'
import { ThesisCard } from './thesis-card'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

const thesis = (overrides: Partial<ThesisItem> = {}): ThesisItem => ({
  id: 't1',
  asset: { symbol: 'BTC', name: 'Bitcoin', path: '/asset/BTC', logoUrl: null },
  claim: 'BTC will close above $150K before December 2026',
  state: 'open',
  target: { direction: 'above', price: 150000 },
  deadline: '2026-12-31T12:00:00.000Z',
  conviction: 3,
  reference: { price: 100000, at: '2026-09-29T12:00:00.000Z' },
  resolution: null,
  cancellation: null,
  publishedAt: '2026-09-29T12:00:00.000Z',
  ...overrides,
})

describe('ThesisCard (specs/profile-track-record PT-07, PT-08)', () => {
  it('opens its page from its claim (specs/thesis-detail TD-17)', () => {
    renderWithIntl(<ThesisCard thesis={thesis()} />)
    expect(
      screen.getByRole('link', { name: 'BTC will close above $150K before December 2026' }),
    ).toHaveAttribute('href', '/thesis/t1')
  })

  it('leads with THESIS and the ticket, the claim second as its title (specs/thesis-ticket Q5)', () => {
    renderWithIntl(<ThesisCard thesis={thesis()} />)
    const card = screen.getByRole('article', {
      name: 'BTC will close above $150K before December 2026',
    })
    expect(card).toHaveTextContent(/^Thesis/)
    expect(screen.getByRole('link', { name: /\$BTC/ })).toHaveAttribute('href', '/asset/BTC')
    expect(screen.getByText('+50% from $100,000')).toBeInTheDocument()
    // The claim after the ticket, second: gray, two lines.
    const claim = screen.getByRole('heading', { level: 3 })
    expect(claim).toHaveClass('text-muted-foreground', 'line-clamp-2')
    expect(screen.getByText('Bitcoin').compareDocumentPosition(claim)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
  })

  it('shows how a correct thesis ended, without votes', () => {
    renderWithIntl(
      <ThesisCard
        thesis={thesis({
          state: 'correct',
          resolution: { price: 182.47, at: '2026-12-31T12:00:00.000Z', source: 'automatic' },
        })}
      />,
    )
    expect(screen.getByText(/^Correct on Dec 31, 2026 at \$182\.47/)).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
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
    // The chip: the ticket's result says it too, once closed.
    const chip = screen.getByText(label, { selector: '[data-state]' })
    expect(chip).toHaveAttribute('data-state', state)
    const mark = chip.querySelector('svg')
    if (icon) expect(mark).toHaveClass(`lucide-${icon}`)
    else expect(mark).toBeNull()
  })

  it('offers "⋯" to feature it only on your own profile (specs/profile-showcase PS-07)', () => {
    const name = 'Options for the thesis BTC will close above $150K before December 2026'
    const { unmount } = renderWithIntl(<ThesisCard thesis={thesis()} menu />)
    expect(screen.queryByRole('button', { name })).toBeNull()
    unmount()
    renderWithIntl(
      <FeaturedMenuContext
        value={{ isFeatured: () => false, full: false, max: 3, pending: false, set: vi.fn() }}
      >
        <ThesisCard thesis={thesis()} menu />
      </FeaturedMenuContext>,
    )
    expect(screen.getByRole('button', { name })).toHaveAttribute('aria-haspopup', 'menu')
  })
})
