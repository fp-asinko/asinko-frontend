import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import type { AssetMarket as Market } from '../communities.types'
import { AssetMarket } from './asset-market'

const market = (overrides: Partial<Market> = {}): Market => ({
  price: 97430.12,
  changePct: 2.14,
  stale: false,
  updatedAt: '2026-10-13T15:17:00.000Z',
  currency: 'USD',
  ...overrides,
})

describe('AssetMarket (specs/backend-adoption BK-05, BK-06)', () => {
  it('shows the price in dollars and the change with its arrow and its words', () => {
    renderWithIntl(<AssetMarket market={market()} />)
    expect(screen.getByText('$97,430.12')).toBeInTheDocument()
    expect(screen.getByText('up 2.14%')).toBeInTheDocument()
    expect(screen.queryByText(/Out of date/)).toBeNull()
  })

  it('says an old price is out of date, and when it was updated', () => {
    renderWithIntl(<AssetMarket market={market({ stale: true, changePct: -0.5 })} />)
    expect(screen.getByText(/Out of date · updated 10\/13/)).toBeInTheDocument()
    expect(screen.getByText('down 0.5%')).toBeInTheDocument()
  })

  it('marks an old price even when the backend does not say when it was updated', () => {
    renderWithIntl(<AssetMarket market={market({ stale: true, updatedAt: null })} />)
    expect(screen.getByText('Out of date')).toBeInTheDocument()
  })

  it('shows a currency pair without a currency of its own, and in the page locale', () => {
    renderWithIntl(<AssetMarket market={market({ price: 1.0832, currency: null })} />, {
      locale: 'es',
    })
    expect(screen.getByText('1,0832')).toBeInTheDocument()
  })

  it('says there is no market data yet without a price', () => {
    renderWithIntl(<AssetMarket market={null} />)
    expect(screen.getByText('No market data yet')).toBeInTheDocument()
  })
})
