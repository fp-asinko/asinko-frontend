import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ThesisTicketData } from '@/lib/theses/ticket.types'
import { renderWithIntl } from '@/test/render-with-intl'
import { anchor, ThesisProgress } from './thesis-progress'

const ticket = (overrides: Partial<ThesisTicketData> = {}): ThesisTicketData => ({
  id: 't1',
  asset: { symbol: 'NVDA', name: 'NVIDIA', path: '/asset/NVDA', logoUrl: null },
  target: { direction: 'above', price: 270 },
  current: { price: 236, at: '2026-11-03T12:00:00.000Z', stale: false },
  reference: { price: 224.72, at: '2026-11-01T12:00:00.000Z' },
  deadline: '2027-11-04T12:00:00.000Z',
  number: null,
  conviction: 2,
  state: 'open',
  resolution: null,
  cancellation: null,
  ...overrides,
})

const at = (price: number) => ({ current: { price, at: null, stale: false } })

/** The line above the bar: where it is and which way it has to go. */
const line = (container: HTMLElement) => container.querySelector('[data-progress] > p')

describe('ThesisProgress (specs/thesis-identity)', () => {
  it('says where today’s price is and which way it has to go, and what each end is (TI-01, TI-16)', () => {
    const { container } = renderWithIntl(<ThesisProgress thesis={ticket()} />)
    expect(line(container)).toHaveTextContent('Today $236 · needs to rise 14.4% more')
    expect(screen.getByText('Entry $224.72')).toBeInTheDocument()
    expect(screen.getByText('Target $270')).toBeInTheDocument()
    // The bar is drawn; the words say it.
    expect(container.querySelector('[data-progress="toward"] > [aria-hidden]')).not.toBeNull()
  })

  it('says a bearish one has to fall, its bar in red (TI-02)', () => {
    const { container } = renderWithIntl(
      <ThesisProgress
        thesis={ticket({ target: { direction: 'below', price: 200 }, ...at(210) })}
      />,
    )
    expect(line(container)).toHaveTextContent('Today $210 · needs to fall 4.8% more')
    expect(container.querySelector('[data-progress]')).toHaveAttribute('data-tone', 'below')
  })

  it('says the target is reached, and how far against it went (TI-03, TI-04)', () => {
    const { container, rerender } = renderWithIntl(<ThesisProgress thesis={ticket(at(280))} />)
    expect(line(container)).toHaveTextContent('Today $280 · target reached')
    rerender(<ThesisProgress thesis={ticket(at(215))} />)
    expect(line(container)).toHaveTextContent('Today $215 · 4.3% below the entry')
  })

  it('says where a closed one closed, and when an old price is from (TI-05, TI-06)', () => {
    const { container, rerender } = renderWithIntl(
      <ThesisProgress
        thesis={ticket({
          state: 'incorrect',
          resolution: { price: 250, at: '2027-11-04T12:00:00.000Z', source: 'automatic' },
        })}
      />,
    )
    expect(line(container)).toHaveTextContent('Closed at $250 · ended 8% short of the target')
    rerender(
      <ThesisProgress
        thesis={ticket({ current: { price: 236, at: '2026-11-03T12:00:00.000Z', stale: true } })}
      />,
    )
    expect(line(container)).toHaveTextContent(
      'Today $236 · needs to rise 14.4% more · price from Nov 3, 2026',
    )
  })

  it('reads in another locale', () => {
    const { container } = renderWithIntl(
      <ThesisProgress
        thesis={ticket({ target: { direction: 'below', price: 200 }, ...at(210) })}
      />,
      { locale: 'es' },
    )
    expect(line(container)).toHaveTextContent(/^Hoy .+ · tiene que bajar un 4,8 % más$/)
  })

  it('shows only today’s price on screen, over its dot (PO, 2026-11-09)', () => {
    const { container } = renderWithIntl(<ThesisProgress thesis={ticket()} />)
    const marker = container.querySelector('[data-marker]')
    expect(marker).toHaveTextContent(/^Today \$236$/)
    expect(marker).toHaveAttribute('aria-hidden')
    // The full sentence stays for screen readers.
    expect(line(container)).toHaveClass('sr-only')
  })

  it('centers the label on the dot, sliding it inward near the ends', () => {
    expect(anchor(0.5)).toBe(0.5)
    expect(anchor(0.2)).toBe(0.5)
    expect(anchor(0)).toBe(0)
    expect(anchor(0.1)).toBeCloseTo(0.25)
    expect(anchor(1)).toBe(1)
    expect(anchor(0.9)).toBeCloseTo(0.75)
  })

  it('draws nothing without a price or for a target at a price (TI-06, TI-07)', () => {
    const { container, rerender } = renderWithIntl(
      <ThesisProgress thesis={ticket({ current: null })} />,
    )
    expect(container).toBeEmptyDOMElement()
    rerender(<ThesisProgress thesis={ticket({ target: { direction: 'equals', price: 270 } })} />)
    expect(container).toBeEmptyDOMElement()
  })
})
