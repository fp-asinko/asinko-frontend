import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { AssetTiles } from './asset-tiles'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

const tile = {
  handle: '$BTC',
  symbol: 'BTC',
  name: 'Bitcoin',
  changePct: 2.4,
  price: 64000,
  stale: false,
  communitySlug: 'BTC',
  path: '/asset/BTC',
}

describe('AssetTiles (H-07, H-21)', () => {
  it('links each tile to its asset page (specs/community-pages CP-14)', () => {
    renderWithIntl(<AssetTiles tiles={[tile]} />)
    expect(screen.getByRole('link', { name: /^Bitcoin \$BTC/ })).toHaveAttribute(
      'href',
      '/asset/BTC',
    )
    expect(screen.getByText('24h')).toBeInTheDocument()
  })

  it('names the tile with everything it shows: change direction and price (WCAG 1.3.1)', () => {
    renderWithIntl(<AssetTiles tiles={[{ ...tile, changePct: -1.2 }]} />)
    // 10,000 or more reads compact: $64K.
    expect(screen.getByRole('link')).toHaveAccessibleName('Bitcoin $BTC down 1.2% $64K')
  })

  it('marks a stale price, also in the link name', () => {
    renderWithIntl(<AssetTiles tiles={[{ ...tile, stale: true }]} />)
    expect(screen.getByRole('link')).toHaveAccessibleName(/Outdated price/)
  })
})
