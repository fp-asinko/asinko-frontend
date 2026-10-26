import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import type { AdItem } from '../feed.types'
import { CommentAd } from './comment-ad'
import { FeedAd } from './feed-ad'

const ad = (overrides: Partial<AdItem> = {}): AdItem => ({
  kind: 'ad',
  id: '00000000-0000-4000-8000-000000031001',
  advertiser: 'AvaTrade',
  logoUrl: null,
  body: null,
  url: 'https://www.avatrade.com/forex',
  domain: 'avatrade.com',
  image: {
    src: '/mocks/ads/avatrade-forex.jpg',
    width: 1200,
    height: 628,
    alt: 'Forex made simple, for first-time traders.',
  },
  ...overrides,
})

for (const [name, Card] of [
  ['FeedAd', FeedAd],
  ['CommentAd', CommentAd],
] as const) {
  describe(`${name} (specs/ads)`, () => {
    it('says it is an ad first, with its advertiser (AD-07)', () => {
      renderWithIntl(<Card ad={ad()} />)
      const region = screen.getByRole('region', { name: 'Ad: AvaTrade' })
      expect(region).toHaveTextContent(/AvaTrade\s*·\s*Ad/)
    })

    it('shows the piece whole, with its own alt and size (AD-02, AD-03, AD-07)', () => {
      renderWithIntl(<Card ad={ad()} />)
      const image = screen.getByRole('img', { name: 'Forex made simple, for first-time traders.' })
      expect(image).toHaveAttribute('width', '1200')
      expect(image).toHaveAttribute('height', '628')
    })

    it('opens the advertiser in another tab, sponsored, with its real domain (AD-06)', () => {
      renderWithIntl(<Card ad={ad()} />)
      const link = screen.getByRole('link', {
        name: 'Learn more about AvaTrade (opens in a new tab)',
      })
      expect(link).toHaveAttribute('href', 'https://www.avatrade.com/forex')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'sponsored noopener noreferrer')
      expect(screen.getByText('avatrade.com')).toBeInTheDocument()
    })

    it('adds its own text when it has one, and draws no image without one', () => {
      renderWithIntl(<Card ad={ad({ body: 'Stocks with 0% commission.', image: null })} />)
      expect(screen.getByText('Stocks with 0% commission.')).toBeInTheDocument()
      expect(screen.queryByRole('img', { name: /Forex/ })).toBeNull()
    })
  })
}

describe('FeedAd height (AD-03)', () => {
  it('caps a tall piece in phones only, whole, holding its place before it loads', () => {
    renderWithIntl(
      <FeedAd ad={ad({ image: { src: '/a.jpg', width: 1200, height: 1500, alt: 'Indices' } })} />,
    )
    expect(screen.getByRole('img', { name: 'Indices' })).toHaveClass(
      'max-h-135',
      // From md, the width of the column and the height the piece needs (PO, 2026-10-26).
      'md:max-h-none',
      'w-full',
      'object-contain',
    )
  })
})
