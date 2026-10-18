import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { communityPage } from '../communities.fixture'
import { CommunityDetails, MarketDetails } from './community-details'
import { CommunityHeader } from './community-header'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))
vi.mock('@/lib/communities/join-community.action', () => ({ joinCommunity: vi.fn() }))
vi.mock('@/lib/communities/leave-community.action', () => ({ leaveCommunity: vi.fn() }))
vi.mock('@/lib/communities/set-favorite.action', () => ({ setFavorite: vi.fn() }))

// The asset's market data is asked on the server (AssetDetails, async): not here.
vi.mock('../lib/asset-api', () => ({ getAssetSummary: vi.fn() }))

describe('CommunityHeader (specs/community-pages CP-04)', () => {
  it('titles the page with the handle and shows description, members and the way back', () => {
    renderWithIntl(<CommunityHeader page={communityPage()} />)
    expect(screen.getByRole('heading', { level: 1, name: '#macro' })).toBeInTheDocument()
    expect(screen.getByText('Rates, inflation and central banks.')).toBeInTheDocument()
    // The number in bold, the label gray (prototype): one sentence for screen readers.
    expect(screen.getByText('1,204').closest('p')).toHaveTextContent('1,204 members')
    // Always to the Home, whichever page came before (CP-22).
    expect(screen.getByRole('link', { name: 'Back' })).toHaveAttribute('href', '/')
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
    expect(screen.getByText('1').closest('p')).toHaveTextContent('1 miembro')
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

  it("shows an asset's market data open when it has a price (specs/backend-adoption BK-05)", () => {
    renderWithIntl(
      <MarketDetails
        title="Asset data"
        market={{
          price: 97430.12,
          changePct: 2.14,
          stale: false,
          updatedAt: null,
          currency: 'USD',
        }}
      />,
    )
    expect(screen.getByRole('button', { name: 'Asset data' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    expect(screen.getByText('$97,430.12')).toBeInTheDocument()
  })

  it('keeps it closed without a price, with an explicit empty state (CP-10)', async () => {
    renderWithIntl(<MarketDetails title="Asset data" market={null} />)
    const trigger = screen.getByRole('button', { name: 'Asset data' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(trigger)
    expect(await screen.findByText('No market data yet')).toBeInTheDocument()
    expect(screen.queryByText(/\$\d|%/)).toBeNull()
  })
})

describe('CommunityHeader, Create post (specs/post-create-detail PC-03, specs/submit-page SU-02)', () => {
  it('offers "Create post" beside Join, as Reddit, to the page with this community chosen', () => {
    renderWithIntl(<CommunityHeader page={communityPage()} />)
    expect(screen.getByRole('link', { name: 'Create post' })).toHaveAttribute(
      'href',
      '/submit?community=macro',
    )
    expect(screen.getByRole('button', { name: 'Join #macro' })).toBeInTheDocument()
  })
})
