import { screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ThesisTicketData } from '@/lib/theses/ticket.types'
import { renderWithIntl } from '@/test/render-with-intl'
import { ThesisTicket } from './thesis-ticket'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

const ticket = (overrides: Partial<ThesisTicketData> = {}): ThesisTicketData => ({
  id: 't1',
  asset: { symbol: 'NVDA', name: 'NVIDIA', path: '/asset/NVDA', logoUrl: null },
  target: { direction: 'above', price: 240 },
  current: null,
  reference: { price: 180, at: '2026-11-04T12:00:00.000Z' },
  deadline: '2027-11-04T12:00:00.000Z',
  number: null,
  conviction: 3,
  state: 'open',
  resolution: null,
  cancellation: null,
  ...overrides,
})

/** The value under a label of the ticket. */
const datum = (label: string) => screen.getByText(label, { selector: 'dt' }).nextElementSibling!

describe('ThesisTicket (specs/thesis-ticket TK-03 to TK-08)', () => {
  it('leads with the asset and its page, and the target in words beside its arrow (TK-04, TK-05)', () => {
    renderWithIntl(<ThesisTicket thesis={ticket()} />)
    expect(screen.getByRole('link', { name: /\$NVDA/ })).toHaveAttribute('href', '/asset/NVDA')
    expect(screen.getByText('NVIDIA')).toBeInTheDocument()
    // The arrow is drawn; its word is read.
    expect(datum('Target')).toHaveTextContent(/^Above \$240/)
    // Green up, red down (PO, 2026-11-05).
    expect(datum('Target').querySelector('.text-bullish')).toHaveTextContent('Above $240+33.3%')
    expect(datum('Target').querySelector('[data-change]')).toHaveTextContent('+33.3%')
    expect(screen.getByText('from $180')).toBeInTheDocument()
    expect(datum('Asset')).toHaveTextContent(/\$NVDA/)
  })

  it('gives its three cells the same shape: a label, a value, a gray line (PO, 2026-11-06)', () => {
    renderWithIntl(<ThesisTicket thesis={ticket()} />)
    expect(datum('Asset')).toHaveTextContent('NVIDIA')
    expect(datum('Conviction')).toHaveTextContent('High3 of 4')
    expect(datum('Target')).toHaveTextContent('+33.3%from $180')
  })

  it.each([
    ['above', 'bull'],
    ['below', 'bear'],
    ['equals', null],
  ] as const)(
    'labels a bet %s with its animal beside Target (specs/thesis-agree AG-19)',
    (direction, mark) => {
      const { container } = renderWithIntl(
        <ThesisTicket thesis={ticket({ target: { direction, price: 240 } })} />,
      )
      const label = screen.getByText('Target', { selector: 'dt' })
      expect(label.querySelector('[data-mark]')?.getAttribute('data-mark') ?? null).toBe(mark)
      expect(container.querySelectorAll('[data-mark]')).toHaveLength(mark ? 1 : 0)
    },
  )

  it('says the conviction with its name and bars, and the deadline with what is left (TK-06)', () => {
    renderWithIntl(<ThesisTicket thesis={ticket()} />)
    expect(datum('Conviction')).toHaveTextContent('High')
    expect(datum('Conviction').querySelectorAll('.bg-level-3')).toHaveLength(3)
    expect(datum('Deadline')).toHaveTextContent(/^Nov 4, 2027 · in \d+ (months|year)/)
  })

  it('shows the result in the deadline’s place once closed, with ✓ or ✗ (TK-07)', () => {
    renderWithIntl(
      <ThesisTicket
        thesis={ticket({
          state: 'correct',
          resolution: { price: 251.2, at: '2027-11-04T12:00:00.000Z', source: 'automatic' },
        })}
      />,
    )
    expect(screen.queryByText('Deadline')).toBeNull()
    const result = datum('Result')
    expect(result).toHaveTextContent(/^Correct on Nov 4, 2027 at \$251\.2.* · automatically$/)
    expect(result.querySelector('svg.lucide-check')).not.toBeNull()
  })

  it('says why it was cancelled', () => {
    renderWithIntl(
      <ThesisTicket
        thesis={ticket({
          state: 'cancelled',
          cancellation: { at: '2026-11-05T12:00:00.000Z', reason: 'Posted twice by mistake.' },
        })}
      />,
    )
    expect(datum('Result')).toHaveTextContent('Cancelled on Nov 5, 2026: Posted twice by mistake.')
  })

  it('keeps only the conviction and the deadline without an asset (TK-08)', () => {
    renderWithIntl(<ThesisTicket thesis={ticket({ asset: null, target: null })} />)
    expect(screen.queryByRole('link')).toBeNull()
    expect(datum('Conviction')).toHaveTextContent('High')
    expect(datum('Deadline')).toBeInTheDocument()
  })

  it('on its page, a named section with the entry price’s date and the deadline to the minute (Q4)', () => {
    renderWithIntl(
      <ThesisTicket
        thesis={ticket({
          state: 'expired',
        })}
        variant="detail"
      />,
    )
    const section = screen.getByRole('region', { name: 'The bet' })
    expect(within(section).getByText('from $180 on Nov 4, 2026')).toBeInTheDocument()
    // Closed: the deadline stays beside the result.
    expect(datum('Deadline')).toHaveTextContent(/Nov 4, 2027, \d{1,2}:\d{2}/)
    expect(datum('Result')).toHaveTextContent('Waiting for resolution')
  })

  it('formats prices in the page language', () => {
    renderWithIntl(
      <ThesisTicket thesis={ticket({ target: { direction: 'below', price: 15000 } })} />,
      {
        locale: 'es',
      },
    )
    expect(screen.getByText('Objetivo', { selector: 'dt' }).nextElementSibling).toHaveTextContent(
      /^Por debajo de .*15\.000/,
    )
  })
})

describe('ThesisTicket as a paper ticket (specs/thesis-identity)', () => {
  it('splits in two stubs, perforated between them (TI-12, TI-13)', () => {
    const { container } = renderWithIntl(<ThesisTicket thesis={ticket()} />)
    expect(container.querySelector('.ticket-stub-top')).not.toBeNull()
    const bottom = container.querySelector('.ticket-stub-bottom')!
    expect(bottom.querySelector('.border-dashed')).toHaveAttribute('aria-hidden', 'true')
    // The deadline below the perforation.
    expect(bottom).toHaveTextContent(/Deadline/)
  })

  it('shows how it is doing above the perforation, with today’s price (TI-01, Q1)', () => {
    const { container } = renderWithIntl(
      <ThesisTicket thesis={ticket({ current: { price: 210, at: null, stale: false } })} />,
    )
    expect(container.querySelector('.ticket-stub-top [data-progress="toward"]')).not.toBeNull()
  })

  it('stamps a closed one below, and an open one not (TI-14, Q3)', () => {
    const { container, rerender } = renderWithIntl(<ThesisTicket thesis={ticket()} />)
    expect(container.querySelector('[data-stamp]')).toBeNull()
    rerender(<ThesisTicket thesis={ticket({ state: 'expired' })} />)
    expect(container.querySelector('.ticket-stub-bottom [data-stamp="expired"]')).not.toBeNull()
  })
})

describe('ThesisTicket and its number (specs/thesis-number)', () => {
  it('prints its number on its lower stub, open or closed, under the state stamp (TN-01, TN-02)', () => {
    const { container, rerender } = renderWithIntl(
      <ThesisTicket thesis={ticket({ number: 12 })} author="maria" />,
    )
    const tag = container.querySelector('[data-number="12"]')!
    expect(tag).toBeInTheDocument()
    // On the lower stub, as a ticket's serial.
    expect(tag.closest('.ticket-stub-bottom')).not.toBeNull()
    expect(screen.getByText('Thesis number 12 by maria')).toBeInTheDocument()

    rerender(<ThesisTicket thesis={ticket({ number: 12, state: 'cancelled' })} />)
    expect(container.querySelector('[data-number="12"]')).toBeInTheDocument()
    expect(container.querySelector('.ticket-stub-bottom [data-stamp="cancelled"]')).not.toBeNull()
    // Without an author (a profile's own tab): the number alone.
    expect(screen.getByText('Thesis number 12')).toBeInTheDocument()
  })

  it('has no number without the backend field (TN-05)', () => {
    const { container } = renderWithIntl(<ThesisTicket thesis={ticket()} />)
    expect(container.querySelector('[data-number]')).toBeNull()
  })
})
