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
  number: null,
  conviction: 3,
  current: null,
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

  it('leads with when and THESIS on the right, the ticket, the claim second (specs/thesis-ticket Q5)', () => {
    renderWithIntl(<ThesisCard thesis={thesis()} />)
    const card = screen.getByRole('article', {
      name: 'BTC will close above $150K before December 2026',
    })
    // When on the left, THESIS on the right, as every post's header (TK-01, PO 2026-11-05).
    expect(card).toHaveTextContent(/^.+ agoThesis/)
    expect(screen.getByRole('link', { name: /\$BTC/ })).toHaveAttribute('href', '/asset/BTC')
    expect(screen.getByText('+50% from $100,000')).toBeInTheDocument()
    // The claim after the ticket, second: gray, two lines.
    const claim = screen.getByRole('heading', { level: 3 })
    expect(claim).toHaveClass('text-muted-foreground', 'line-clamp-2')
    expect(screen.getByText('Bitcoin').compareDocumentPosition(claim)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
  })

  it('leaves its author’s accuracy out: the profile says it above (specs/thesis-identity TI-11)', () => {
    renderWithIntl(<ThesisCard thesis={thesis()} />)
    expect(screen.queryByText(/accuracy/i)).toBeNull()
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

  it('says it is open in a chip beside its deadline, in the ticket (PO, 2026-11-05)', () => {
    renderWithIntl(<ThesisCard thesis={thesis()} />)
    const chip = screen.getByText('Open', { selector: '[data-state]' })
    expect(chip.closest('dt')).toHaveTextContent(/^Deadline\s*Open$/)
  })

  it.each([
    ['correct', /^Correct/, 'check'],
    ['incorrect', /^Incorrect/, 'x'],
    ['disputed', 'Under review', null],
    ['expired', 'Waiting for resolution', null],
    ['cancelled', /^Cancelled/, null],
  ] as const)(
    'says how a %s one stands in its result, with its mark, without a chip',
    (state, text, icon) => {
      renderWithIntl(<ThesisCard thesis={thesis({ state })} />)
      expect(document.querySelector('[data-state]')).toBeNull()
      const result = document.querySelector(`[data-standing="${state}"]`)!
      expect(result).toHaveTextContent(text)
      const mark = result.querySelector('svg')
      if (icon) expect(mark).toHaveClass(`lucide-${icon}`)
      else expect(mark).toBeNull()
    },
  )

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
