import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import type { Preview, PreviewCommunity, ProfileDetails } from '../communities.types'
import { PreviewCard } from './preview-card'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))
vi.mock('@/lib/communities/join-community.action', () => ({ joinCommunity: vi.fn() }))
vi.mock('@/lib/communities/leave-community.action', () => ({ leaveCommunity: vi.fn() }))
vi.mock('@/lib/communities/set-favorite.action', () => ({ setFavorite: vi.fn() }))

const macro: PreviewCommunity = {
  slug: 'macro',
  handle: '#macro',
  subtitle: null,
  description: 'Rates, inflation and central banks.',
  avatarUrl: null,
  bannerUrl: null,
  kind: 'group',
  memberCount: 1204,
  createdAt: null,
  viewerMembership: null,
}
const maria: ProfileDetails = {
  username: 'maria',
  displayName: 'María Ruiz',
  badge: 'verified',
  bio: 'On-chain analyst.',
  avatarUrl: null,
  followerCount: 12400,
  accuracyRate: 0.74,
  currentStreak: 4,
  joinedAt: '2026-03-02T10:00:00.000Z',
  isSelf: false,
}
const person = (profile: Partial<ProfileDetails> = {}): Preview => ({
  community: { ...macro, slug: 'maria', handle: '@maria', kind: 'user', description: null },
  profile: { ...maria, ...profile },
})

/** Each number of the card by its label, as read: { Members: '1.2K' }. */
function stats() {
  const terms = screen.getAllByRole('term')
  return Object.fromEntries(
    terms.map((term) => [term.textContent, term.nextElementSibling?.textContent ?? '']),
  )
}

describe('PreviewCard (specs/mention-preview MP-03 to MP-06)', () => {
  it('shows a group: its name as a link to its page, what it is about, members and Join', () => {
    renderWithIntl(<PreviewCard preview={{ community: macro, profile: null }} summaryId="s" />)
    expect(screen.getByRole('link', { name: '#macro' })).toHaveAttribute('href', '/hub/macro')
    expect(screen.getByText('Rates, inflation and central banks.')).toBeInTheDocument()
    // A system group: no creation date.
    expect(stats()).toEqual({ Members: '1.2K' })
    expect(screen.getByRole('button', { name: 'Join #macro' })).toBeInTheDocument()
    // No favorite star in the card, only Join (Q2).
    expect(screen.queryByRole('button', { name: /favorites/ })).not.toBeInTheDocument()
  })

  it('says when a person created the group', () => {
    renderWithIntl(
      <PreviewCard
        preview={{ community: { ...macro, createdAt: '2025-11-20T10:00:00.000Z' }, profile: null }}
        summaryId="s"
      />,
    )
    expect(stats()).toEqual({ Members: '1.2K', Created: 'Nov 2025' })
  })

  it('shows an asset with its name, and "Joined" for a member', () => {
    renderWithIntl(
      <PreviewCard
        preview={{
          community: {
            ...macro,
            slug: 'BTC',
            handle: '$BTC',
            subtitle: 'Bitcoin',
            kind: 'asset',
            viewerMembership: 'MEMBER',
          },
          profile: null,
        }}
        summaryId="s"
      />,
    )
    expect(screen.getByRole('link', { name: '$BTC' })).toHaveAttribute('href', '/asset/BTC')
    expect(screen.getByText('Bitcoin')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Joined/ })).toBeInTheDocument()
  })

  it('shows a person: name, badge, bio, followers, accuracy, streak and Follow', () => {
    renderWithIntl(<PreviewCard preview={person()} summaryId="summary" />)
    expect(screen.getByRole('link', { name: 'María Ruiz' })).toHaveAttribute('href', '/user/maria')
    expect(screen.getByText('@maria')).toBeInTheDocument()
    expect(screen.getByText('Verified')).toBeInTheDocument()
    expect(screen.getByText('On-chain analyst.')).toBeInTheDocument()
    const summary = document.getElementById('summary')!
    expect(stats()).toEqual({
      Followers: '12.4K',
      Accuracy: '74%',
      Streak: '4',
      'Member since': 'Mar 2026',
    })
    expect(summary).toHaveTextContent('On-chain analyst.')
    // The summary is what describes the link: the button stays out of it.
    const follow = screen.getByRole('button', { name: /^Follow/ })
    expect(summary).not.toContainElement(follow)
  })

  it('offers no button on your own card, and titles with the handle without a name', () => {
    renderWithIntl(
      <PreviewCard preview={person({ isSelf: true, displayName: null })} summaryId="s" />,
    )
    expect(screen.getByRole('link', { name: '@maria' })).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('leaves out an accuracy not known yet', () => {
    renderWithIntl(<PreviewCard preview={person({ accuracyRate: null })} summaryId="s" />)
    expect(Object.keys(stats())).toEqual(['Followers', 'Streak', 'Member since'])
  })
})
