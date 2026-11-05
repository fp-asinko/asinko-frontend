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
  reference: { price: 180, at: '2026-11-04T12:00:00.000Z' },
  deadline: '2027-11-04T12:00:00.000Z',
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
    const target = screen.getByText('$240', { exact: false, selector: 'p' })
    expect(target).toHaveTextContent('Above $240')
    // Green up, red down (PO, 2026-11-05).
    expect(target).toHaveClass('text-bullish')
    expect(screen.getByText('+33.3% from $180')).toBeInTheDocument()
  })

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
    expect(within(section).getByText('+33.3% from $180 on Nov 4, 2026')).toBeInTheDocument()
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
    expect(screen.getByText(/15\.000/, { selector: 'p' })).toHaveTextContent(/^Por debajo de/)
  })
})
