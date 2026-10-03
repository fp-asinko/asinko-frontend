import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { identityIndex } from '@/lib/identity-color'
import { renderWithIntl } from '@/test/render-with-intl'
import { SuggestedCommunities } from './suggested-communities'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

const nft = { handle: '#nft', slug: 'nft', name: 'NFT', memberCount: 1200, avatarUrl: null }

describe('SuggestedCommunities (H-07)', () => {
  it('links each suggestion, named by its handle and member count', () => {
    renderWithIntl(<SuggestedCommunities suggestions={[nft]} />)
    expect(screen.getByRole('link', { name: '#nft 1,200 members' })).toHaveAttribute(
      'href',
      '/?community=nft',
    )
  })

  it('offers joining as coming soon, with a translated label (H-26)', () => {
    renderWithIntl(<SuggestedCommunities suggestions={[nft]} />)
    expect(screen.getByRole('button', { name: 'Join #nft' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })

  it('builds the join label as a whole message in each locale', () => {
    renderWithIntl(<SuggestedCommunities suggestions={[nft]} />, { locale: 'es' })
    expect(screen.getByRole('button', { name: 'Unirse a #nft' })).toBeInTheDocument()
  })

  it('colors the avatar by the slug, like the feed does (FC-01)', () => {
    renderWithIntl(
      <SuggestedCommunities suggestions={[{ ...nft, name: 'On-chain', slug: 'onchain' }]} />,
    )
    expect(screen.getByTestId('user-avatar')).toHaveAttribute(
      'data-color',
      String(identityIndex('onchain')),
    )
  })
})
