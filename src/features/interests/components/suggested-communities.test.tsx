import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { identityIndex } from '@/lib/identity-color'
import { AuthGateProvider } from '@/components/organisms/auth-gate'
import { JoinedProvider } from '@/components/organisms/join'
import { renderWithIntl } from '@/test/render-with-intl'
import { SuggestedCommunities } from './suggested-communities'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))
const deps = vi.hoisted(() => ({ joinCommunity: vi.fn() }))
vi.mock('@/lib/communities/join-community.action', () => ({ joinCommunity: deps.joinCommunity }))

const nft = { handle: '#nft', slug: 'nft', name: 'NFT', memberCount: 1200, avatarUrl: null }

describe('SuggestedCommunities (H-07)', () => {
  it('links each suggestion, named by its handle and member count', () => {
    renderWithIntl(<SuggestedCommunities suggestions={[nft]} />)
    expect(screen.getByRole('link', { name: '#nft 1,200 members' })).toHaveAttribute(
      'href',
      '/?community=nft',
    )
  })

  it('joins for real and hides the row at once (specs/community-first CF-10)', async () => {
    deps.joinCommunity.mockResolvedValue({ ok: true, data: { memberCount: 1201 } })
    renderWithIntl(
      <AuthGateProvider signedIn>
        <JoinedProvider>
          <SuggestedCommunities suggestions={[nft]} />
        </JoinedProvider>
      </AuthGateProvider>,
    )
    const join = screen.getByRole('button', { name: 'Join #nft' })
    expect(join).not.toHaveAttribute('aria-disabled')
    await userEvent.click(join)
    expect(deps.joinCommunity).toHaveBeenCalledWith('nft')
    expect(screen.queryByRole('link', { name: '#nft 1,200 members' })).toBeNull()
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

  it('opens the account modal to join without a session (G-04)', async () => {
    renderWithIntl(
      <AuthGateProvider signedIn={false}>
        <SuggestedCommunities suggestions={[nft]} />
      </AuthGateProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Join #nft' }))
    expect(
      await screen.findByRole('dialog', { name: 'Join Asinko to join communities' }),
    ).toBeInTheDocument()
  })
})
