import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setPathname } from '@/test/navigation-mock'
import { renderWithIntl } from '@/test/render-with-intl'
import type { AssetRow } from '../interests.types'
import { AssetList } from './asset-list'

// Its stars call a Server Action, which needs the env: not here (testing.md § Mocks).
vi.mock('@/lib/communities/set-favorite.action', () => ({ setFavorite: vi.fn() }))

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

const btc: AssetRow = {
  handle: '$BTC',
  symbol: 'BTC',
  name: 'Bitcoin',
  changePct: 2.14,
  price: 83584.01,
  stale: false,
  priceUpdatedAt: '2026-10-13T12:00:00.000Z',
  logoUrl: null,
  assetClass: 'CRYPTO',
  communitySlug: 'BTC',
  favorite: false,
  path: '/asset/BTC',
}

const wti: AssetRow = {
  ...btc,
  handle: '$WTI',
  symbol: 'WTI',
  name: 'WTI Crude Oil',
  changePct: null,
  price: null,
  priceUpdatedAt: null,
  assetClass: 'COMMODITY',
  communitySlug: 'wti',
  path: '/asset/WTI',
}

beforeEach(() => setPathname('/'))

describe('AssetList (specs/sidebar-assets-list)', () => {
  it('is a list with one row per asset, without the old tiles grid nor a visible 24h (SA-01)', () => {
    renderWithIntl(<AssetList assets={[btc, wti]} />)
    const list = screen.getByRole('list')
    expect(within(list).getAllByRole('listitem')).toHaveLength(2)
    expect(list).not.toHaveClass('grid')
    // The period is spoken, never drawn (Q8).
    expect(screen.getByText('24h')).toHaveClass('sr-only')
  })

  it('shows logo, symbol without $, price and change, in that order (SA-02)', () => {
    renderWithIntl(<AssetList assets={[btc]} />)
    const link = screen.getByRole('link', { name: /^Bitcoin BTC/ })
    const order = [
      screen.getByTestId('user-avatar'),
      screen.getByText('BTC'),
      screen.getByText('$83.6K'),
      screen.getByText('2.14%'),
    ]
    for (const [index, element] of order.entries()) {
      expect(link).toContainElement(element)
      const next = order[index + 1]
      if (next) {
        expect(
          element.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy()
      }
    }
    expect(screen.queryByText('$BTC')).not.toBeInTheDocument()
  })

  it('shows the logo when there is one, the initials when there is not (SA-03)', () => {
    const { container, unmount } = renderWithIntl(
      <AssetList assets={[{ ...btc, logoUrl: '/mocks/btc.png' }]} />,
    )
    expect(container.querySelector('img')).toHaveAttribute('alt', '')
    unmount()
    renderWithIntl(<AssetList assets={[btc]} />)
    expect(screen.getByTestId('user-avatar')).toHaveTextContent('BT')
    expect(screen.getByTestId('user-avatar')).toHaveAttribute('aria-hidden', 'true')
  })

  it('links to the asset page and names the link with everything it shows (SA-04)', () => {
    renderWithIntl(<AssetList assets={[btc]} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/asset/BTC')
    expect(link).toHaveAccessibleName('Bitcoin BTC $83.6K up 2.14% 24h')
  })

  it('marks the page shown, with a gray background (SA-04)', () => {
    setPathname('/asset/BTC')
    renderWithIntl(<AssetList assets={[btc]} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('aria-current', 'page')
    expect(link.className).toContain('aria-[current=page]:bg-muted')
  })

  describe('change (SA-05)', () => {
    it('says the direction with an arrow and a spoken text, going down', () => {
      renderWithIntl(<AssetList assets={[{ ...btc, changePct: -1.2 }]} />)
      expect(screen.getByRole('link')).toHaveAccessibleName('Bitcoin BTC $83.6K down 1.2% 24h')
    })

    it('says unchanged for zero', () => {
      renderWithIntl(<AssetList assets={[{ ...btc, changePct: 0 }]} />)
      expect(screen.getByRole('link')).toHaveAccessibleName(/unchanged/)
    })

    it('takes the text color on gray: on hover and on the open page', () => {
      renderWithIntl(<AssetList assets={[btc]} />)
      const classes = screen.getByRole('link').className
      expect(classes).toContain('hover:bg-surface')
      expect(classes).toContain('hover:[&_.text-bullish]:text-foreground')
      expect(classes).toContain('hover:[&_.text-bearish]:text-foreground')
      expect(classes).toContain('aria-[current=page]:[&_.text-bullish]:text-foreground')
      expect(classes).toContain('aria-[current=page]:[&_.text-bearish]:text-foreground')
    })
  })

  it('formats the price by the asset class (SA-06)', () => {
    renderWithIntl(
      <AssetList
        assets={[
          { ...btc, price: 356.04, assetClass: 'EQUITY' },
          { ...btc, symbol: 'EURUSD', name: 'Euro', price: 1.1234, assetClass: 'FOREX' },
        ]}
      />,
    )
    expect(screen.getByText('$356.04')).toBeInTheDocument()
    expect(screen.getByText('1.1234')).toBeInTheDocument()
  })

  it('keeps an asset without a price as a row: dash, no change, spoken text (SA-07)', () => {
    renderWithIntl(<AssetList assets={[wti]} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/asset/WTI')
    expect(link).toHaveAccessibleName('WTI Crude Oil WTI No price yet')
    expect(screen.getByText('—')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.queryByText(/%/)).not.toBeInTheDocument()
  })

  describe('stale price (SA-08, PO feedback 2026-11-12)', () => {
    const stale = { ...btc, stale: true }

    it('says since when in the link name', () => {
      renderWithIntl(<AssetList assets={[stale]} />)
      expect(screen.getByRole('link')).toHaveAccessibleName(
        'Bitcoin BTC Price as of Oct 13 $83.6K up 2.14% 24h',
      )
    })

    it('falls back to the plain warning without a date', () => {
      renderWithIntl(<AssetList assets={[{ ...stale, priceUpdatedAt: null }]} />)
      expect(screen.getByRole('link')).toHaveAccessibleName(/Outdated price \$83\.6K/)
    })

    it('puts the clock inside the price cell, with the price muted', () => {
      renderWithIntl(<AssetList assets={[stale, { ...btc, symbol: 'ETH', name: 'Ethereum' }]} />)
      const [stalePrice, freshPrice] = screen.getAllByText('$83.6K')
      expect(stalePrice!.parentElement!.querySelector('svg')).not.toBeNull()
      expect(stalePrice).toHaveClass('text-muted-foreground')
      expect(freshPrice!.parentElement!.querySelector('svg')).toBeNull()
      expect(freshPrice).not.toHaveClass('text-muted-foreground')
    })

    it('explains the clock in a bubble, hidden from screen readers', () => {
      renderWithIntl(<AssetList assets={[stale]} />)
      const bubble = screen.getByRole('link').querySelector('[data-hint]')
      expect(bubble).toHaveTextContent('Price as of Oct 13')
      expect(bubble).toHaveAttribute('aria-hidden', 'true')
    })

    it('has no bubble nor clock on a fresh price', () => {
      renderWithIntl(<AssetList assets={[btc]} />)
      expect(screen.getByRole('link').querySelector('[data-hint]')).toBeNull()
      expect(screen.getByRole('link').querySelector('svg:not([class*=lucide-arrow])')).toBeNull()
    })
  })

  it('lays every row on the same fixed columns: logo, symbol, price, change (PO feedback)', () => {
    renderWithIntl(<AssetList assets={[btc, { ...wti, stale: true }]} />)
    const [first, second] = screen.getAllByRole('link')
    for (const link of [first!, second!]) {
      expect(link).toHaveClass('grid', 'grid-cols-[1.5rem_minmax(0,1fr)_auto_3.25rem]', 'gap-1.5')
    }
    expect(first!.className).toBe(second!.className)
    // The dash sits in the same price column and carries no clock.
    expect(screen.getByText('—').parentElement).toHaveClass('text-right')
    expect(screen.getByText('—').parentElement!.querySelector('svg')).toBeNull()
  })

  it('keeps the favorite star beside the row, filled on a favorite (SA-09)', () => {
    renderWithIntl(<AssetList assets={[{ ...btc, favorite: true }]} />)
    const star = screen.getByRole('button', { name: 'Remove $BTC from favorites' })
    expect(star).toHaveAttribute('aria-pressed', 'true')
    expect(star).toHaveClass('w-7', 'h-7')
    expect(screen.getByRole('link')).not.toContainElement(star)
  })

  it('puts favorites first (SA-09)', () => {
    renderWithIntl(<AssetList assets={[wti, { ...btc, favorite: true }]} />)
    const hrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href'))
    expect(hrefs).toEqual(['/asset/BTC', '/asset/WTI'])
  })

  it('shows 3, 5 or 8 rows by the column height, all of them with "more" open (SA-10)', () => {
    renderWithIntl(<AssetList assets={[btc]} id="assets-list" />)
    const list = screen.getByRole('list')
    expect(list).toHaveAttribute('id', 'assets-list')
    expect(list).toHaveClass(
      '[&>li:nth-child(n+9)]:hidden',
      'column-tall:[&>li:nth-child(n+6)]:hidden',
      'column-mid:[&>li:nth-child(n+4)]:hidden',
      'group-has-data-[more=open]/section:[&>li]:flex!',
    )
  })
})
