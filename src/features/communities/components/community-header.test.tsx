import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { communityPage } from '../communities.fixture'
import { CommunityDetails } from './community-details'
import { CommunityHeader } from './community-header'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))
vi.mock('@/lib/communities/join-community.action', () => ({ joinCommunity: vi.fn() }))
vi.mock('@/lib/communities/leave-community.action', () => ({ leaveCommunity: vi.fn() }))
vi.mock('@/lib/communities/set-favorite.action', () => ({ setFavorite: vi.fn() }))

describe('CommunityHeader (specs/community-pages CP-04)', () => {
  it('titles the page with the handle and shows description, members and the way back', () => {
    renderWithIntl(<CommunityHeader page={communityPage()} />)
    expect(screen.getByRole('heading', { level: 1, name: '#macro' })).toBeInTheDocument()
    expect(screen.getByText('Rates, inflation and central banks.')).toBeInTheDocument()
    expect(screen.getByText('1,204 members')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Join #macro' })).toBeInTheDocument()
  })

  it('uses the identity gradient without a banner, and the name under an asset symbol', () => {
    renderWithIntl(
      <CommunityHeader
        page={communityPage({ slug: 'NVDA', handle: '$NVDA', subtitle: 'NVIDIA', kind: 'asset' })}
      />,
    )
    expect(screen.getByTestId('identity-banner')).toHaveAttribute('data-color')
    expect(screen.getByText('NVIDIA')).toBeInTheDocument()
  })

  it('counts members in the page locale', () => {
    renderWithIntl(<CommunityHeader page={communityPage({ memberCount: 1 })} />, { locale: 'es' })
    expect(screen.getByText('1 miembro')).toBeInTheDocument()
  })
})

describe('CommunityDetails (specs/community-pages CP-08, CP-10)', () => {
  it('shows a group rules and website closed, the link safe and with its domain', async () => {
    renderWithIntl(
      <CommunityDetails
        page={communityPage({
          rules: 'No paid signals.',
          mainUrl: { url: 'https://defillama.com/', domain: 'defillama.com' },
        })}
      />,
    )
    const trigger = screen.getByRole('button', { name: 'Group rules' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('shows nothing for a group without rules nor website', () => {
    const { container } = renderWithIntl(<CommunityDetails page={communityPage()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows an asset market data open, with an explicit empty state and no numbers', () => {
    renderWithIntl(
      <CommunityDetails page={communityPage({ slug: 'BTC', handle: '$BTC', kind: 'asset' })} />,
    )
    expect(screen.getByRole('button', { name: 'Asset data' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    expect(screen.getByText('No market data yet')).toBeInTheDocument()
    expect(screen.queryByText(/\$\d|%/)).toBeNull()
  })
})
