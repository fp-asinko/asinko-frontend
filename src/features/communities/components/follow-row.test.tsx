import { screen } from '@testing-library/react'
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
  path: '/user/maria',
  avatarUrl: null,
  accuracyRate: 0.74,
  followed: false,
  isSelf: false,
  ...overrides,
})

describe('FollowRow (specs/follow-lists FL-02, FL-05)', () => {
  it('links the person, shows their accuracy in its tier, and offers to follow', () => {
    renderWithIntl(<FollowRow person={person()} kind="followers" />)
    expect(screen.getByRole('link', { name: /@maria/ })).toHaveAttribute('href', '/user/maria')
    const chip = screen.getByText('74%').parentElement!
    expect(chip).toHaveAttribute('data-tier', 'high')
    // Named for screen readers: what the number is.
    expect(screen.getByRole('link', { name: /@maria\s*74% accuracy/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Follow @maria' })).toBeInTheDocument()
  })

  it('says Following for someone the viewer follows', () => {
    renderWithIntl(<FollowRow person={person({ followed: true })} kind="followers" />)
    expect(screen.getByRole('button', { name: /^Following/ })).toBeInTheDocument()
  })

  it('has no button for yourself, nor when it is unknown whether you follow them', () => {
    const { unmount } = renderWithIntl(
      <FollowRow person={person({ isSelf: true, followed: null })} kind="followers" />,
    )
    expect(screen.queryByRole('button')).toBeNull()
    unmount()
    renderWithIntl(<FollowRow person={person({ followed: null })} kind="followers" />)
    expect(screen.queryByRole('button')).toBeNull()
  })
})
