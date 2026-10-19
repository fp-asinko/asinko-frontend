import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { AssetAside } from './asset-aside'

describe('AssetAside (specs/community-widgets CW-03)', () => {
  it('shows the market data in a card of the column', () => {
    renderWithIntl(
      <AssetAside
        market={{
          price: 64000,
          currency: 'USD',
          changePct: 1.2,
          stale: false,
          updatedAt: '2026-10-19T12:00:00.000Z',
        }}
      />,
    )
    const card = screen.getByRole('region', { name: 'Asset data' })
    expect(card).toHaveTextContent('$64,000')
  })

  it('says there is no data without a price', () => {
    renderWithIntl(<AssetAside market={null} />)
    expect(screen.getByRole('region', { name: 'Asset data' })).toHaveTextContent(/no market data/i)
  })
})
