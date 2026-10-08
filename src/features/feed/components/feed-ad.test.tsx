import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import type { HouseAd } from '../feed.types'
import { FeedAd } from './feed-ad'

const ad = (overrides: Partial<HouseAd> = {}): HouseAd => ({
  id: 'a1',
  advertiser: 'Asinko',
  logoUrl: null,
  body: 'Publish your first thesis.',
  url: 'https://example.com/theses',
  domain: 'example.com',
  imageUrl: null,
  ...overrides,
})

describe('FeedAd (specs/post-detail-refresh PD-16)', () => {
  it('reads as an ad first, then who, what, and the real destination', () => {
    renderWithIntl(<FeedAd ad={ad()} />)
    const section = screen.getByRole('region', { name: 'Ad: Asinko' })
    expect(within(section).getByText('Publish your first thesis.')).toBeInTheDocument()
    expect(within(section).getByText('example.com')).toBeInTheDocument()
    const link = within(section).getByRole('link', {
      name: 'Learn more about Asinko (opens in a new tab)',
    })
    expect(link).toHaveAttribute('href', 'https://example.com/theses')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'sponsored noopener noreferrer')
  })

  it('shows its image across the card only when it has one', () => {
    const { rerender } = renderWithIntl(<FeedAd ad={ad()} />)
    expect(document.querySelector('img')).toBeNull()
    rerender(<FeedAd ad={ad({ imageUrl: '/mocks/ad-thesis.svg' })} />)
    expect(document.querySelector('img')).toHaveAttribute('alt', '')
  })
})
