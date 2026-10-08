import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import type { CommentAd as Ad } from '../feed.types'
import { CommentAd } from './comment-ad'

const ad = (overrides: Partial<Ad> = {}): Ad => ({
  id: 'a1',
  advertiser: 'Northwind Ledger (sample)',
  logoUrl: null,
  body: 'Your keys, offline.',
  url: 'https://example.com/northwind',
  domain: 'example.com',
  imageUrl: null,
  ...overrides,
})

describe('CommentAd (specs/post-detail-refresh PD-07 to PD-10)', () => {
  it('says it is an ad first, then who, what, and the real destination', () => {
    renderWithIntl(<CommentAd ad={ad()} />)
    const aside = screen.getByRole('region', { name: 'Ad: Northwind Ledger (sample)' })
    expect(within(aside).getByText('Northwind Ledger (sample)')).toBeInTheDocument()
    expect(within(aside).getByText('Your keys, offline.')).toBeInTheDocument()
    expect(within(aside).getByText('example.com')).toBeInTheDocument()
  })

  it('opens the destination in another tab, sponsored, named by its visible text first', () => {
    renderWithIntl(<CommentAd ad={ad()} />)
    const link = screen.getByRole('link', {
      name: 'Learn more about Northwind Ledger (sample) (opens in a new tab)',
    })
    expect(link).toHaveTextContent('Learn more')
    expect(link).toHaveAttribute('href', 'https://example.com/northwind')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'sponsored noopener noreferrer')
  })

  it('shows its image only when it has one, as decoration', () => {
    const { rerender } = renderWithIntl(<CommentAd ad={ad()} />)
    expect(screen.queryByRole('img', { hidden: true })).not.toBeInTheDocument()
    rerender(<CommentAd ad={ad({ imageUrl: '/mocks/ad-wallet.svg' })} />)
    expect(document.querySelector('img')).toHaveAttribute('alt', '')
  })

  it('speaks Spanish', () => {
    renderWithIntl(<CommentAd ad={ad()} />, { locale: 'es' })
    expect(
      screen.getByRole('region', { name: 'Anuncio: Northwind Ledger (sample)' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveTextContent('Más información')
  })
})
