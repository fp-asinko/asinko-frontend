import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import type { FollowItem } from '../communities.types'
import { FollowRow } from './follow-row'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))
vi.mock('@/lib/communities/join-community.action', () => ({ joinCommunity: vi.fn() }))
vi.mock('@/lib/communities/leave-community.action', () => ({ leaveCommunity: vi.fn() }))
vi.mock('@/lib/communities/set-favorite.action', () => ({ setFavorite: vi.fn() }))

const person = (overrides: Partial<FollowItem> = {}): FollowItem => ({
  username: 'maria',
  displayName: null,
  path: '/user/maria',
  avatarUrl: null,
  accuracyRate: 0.74,
  followed: false,
  isSelf: false,
  ...overrides,
})

describe('FollowRow (specs/follow-lists FL-02, FL-05)', () => {
  it('links the person, shows their accuracy in its tier, and offers to follow', () => {
    renderWithIntl(<FollowRow person={person()} list="followers" />)
    expect(screen.getByRole('link', { name: /@maria/ })).toHaveAttribute('href', '/user/maria')
    const chip = screen.getByText('74%').parentElement!
    expect(chip).toHaveAttribute('data-tier', 'high')
    // Named for screen readers: what the number is.
    expect(screen.getByRole('link', { name: /@maria\s*74% accuracy/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Follow @maria' })).toBeInTheDocument()
  })

  it('says Following for someone the viewer follows', () => {
    renderWithIntl(<FollowRow person={person({ followed: true })} list="followers" />)
    expect(screen.getByRole('button', { name: /^Following/ })).toBeInTheDocument()
  })

  it('has no button for yourself; without a session, Follow (it asks for an account)', () => {
    const { unmount } = renderWithIntl(
      <FollowRow person={person({ isSelf: true, followed: null })} list="followers" />,
    )
    expect(screen.queryByRole('button')).toBeNull()
    unmount()
    renderWithIntl(<FollowRow person={person({ followed: null })} list="followers" />)
    expect(screen.getByRole('button', { name: 'Follow @maria' })).toBeInTheDocument()
  })

  it('asks before unfollowing from a row (BA-09, security.md § 7)', async () => {
    renderWithIntl(<FollowRow person={person({ followed: true })} list="followers" />)
    await userEvent.click(screen.getByRole('button', { name: /^Following/ }))
    expect(await screen.findByRole('dialog', { name: 'Unfollow @maria?' })).toBeInTheDocument()
  })

  it('shows the name, then the @username (specs/backend-answer-1020 BA-09)', () => {
    renderWithIntl(<FollowRow person={person({ displayName: 'María Ruiz' })} list="followers" />)
    expect(screen.getByRole('link', { name: /^María Ruiz @maria/ })).toBeInTheDocument()
  })
})
