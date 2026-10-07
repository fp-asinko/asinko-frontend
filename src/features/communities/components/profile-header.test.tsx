import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AuthGateProvider } from '@/components/organisms/auth-gate'
import { JoinedProvider } from '@/components/organisms/join'
import { renderWithIntl } from '@/test/render-with-intl'
import type { ProfileDetails } from '../communities.types'
import { communityPage } from '../communities.fixture'
import { CommunityDetails } from './community-details'
import { CommunityHeader } from './community-header'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))
const actions = vi.hoisted(() => ({ joinCommunity: vi.fn(), leaveCommunity: vi.fn() }))
vi.mock('@/lib/communities/join-community.action', () => ({ joinCommunity: actions.joinCommunity }))
vi.mock('@/lib/communities/leave-community.action', () => ({
  leaveCommunity: actions.leaveCommunity,
}))
vi.mock('@/lib/communities/set-favorite.action', () => ({ setFavorite: vi.fn() }))

const channel = communityPage({
  slug: 'federico',
  handle: '@federico',
  kind: 'user',
  description: null,
  rules: 'Data first.',
})

const profile = (overrides: Partial<ProfileDetails> = {}): ProfileDetails => ({
  username: 'federico',
  displayName: 'Federico Piva',
  badge: null,
  bio: 'Macro + crypto.',
  avatarUrl: null,
  followerCount: 3200,
  accuracyRate: 0.68,
  currentStreak: 2,
  isSelf: false,
  ...overrides,
})

function renderHeader(details: ProfileDetails, membership: 'MEMBER' | null = null) {
  renderWithIntl(
    <AuthGateProvider signedIn>
      <JoinedProvider>
        <CommunityHeader page={{ ...channel, viewerMembership: membership }} profile={details} />
      </JoinedProvider>
    </AuthGateProvider>,
  )
}

describe('Profile header (specs/community-pages CP-11, CP-12)', () => {
  it('titles with the display name and @username below, without tier nor rating (after the MVP)', () => {
    renderHeader(profile())
    expect(screen.getByRole('heading', { level: 1, name: 'Federico Piva' })).toBeInTheDocument()
    expect(screen.getByText('@federico')).toBeInTheDocument()
    expect(screen.queryByText('Creator')).toBeNull()
    expect(screen.queryByText(/^Rating/)).toBeNull()
    expect(screen.getByText('Macro + crypto.')).toBeInTheDocument()
  })

  it('titles with @username when there is no display name (the backend today)', () => {
    renderHeader(profile({ displayName: null }))
    expect(screen.getByRole('heading', { level: 1, name: '@federico' })).toBeInTheDocument()
  })

  it('shows followers, accuracy and streak, each number with its word', () => {
    renderHeader(profile())
    const stats = screen.getByText('3,200').closest('p')!
    expect(stats).toHaveTextContent('3,200 followers')
    expect(stats).toHaveTextContent('68% accuracy')
    expect(stats).toHaveTextContent('2 streak')
  })

  it('names a verified or institutional badge for screen readers', () => {
    renderHeader(profile({ badge: 'institutional' }))
    expect(screen.getByText('Institutional')).toBeInTheDocument()
  })

  it('offers "Ask" as coming soon', async () => {
    renderHeader(profile())
    const ask = screen.getByRole('button', { name: 'Ask Federico Piva' })
    expect(ask).toHaveAttribute('aria-disabled', 'true')
  })

  it('follows instead of joining, with no favorite star, and asks before unfollowing', async () => {
    renderHeader(profile(), 'MEMBER')
    expect(screen.queryByRole('button', { name: /favorites/ })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: /^Following/ }))
    expect(await screen.findByRole('dialog', { name: 'Unfollow @federico?' })).toBeInTheDocument()
  })

  it('offers to follow a person not followed yet', () => {
    renderHeader(profile())
    expect(screen.getByRole('button', { name: 'Follow @federico' })).toBeInTheDocument()
  })

  it('has no follow actions on your own profile', () => {
    renderHeader(profile({ isSelf: true }))
    expect(screen.queryByRole('button', { name: /Follow/ })).toBeNull()
  })

  it("titles the rules with the person's name", () => {
    renderWithIntl(<CommunityDetails page={channel} profile={profile()} />)
    expect(screen.getByRole('button', { name: 'Rules of Federico Piva' })).toBeInTheDocument()
  })
})
