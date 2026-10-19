import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { profileDetails } from '../profile.fixture'
import { MemberCount, ProfileStats, TrackRecord } from './community-stats'

vi.mock('../actions/load-people.action', () => ({ loadPeople: vi.fn() }))

describe('community stats (specs/community-pages CP-11)', () => {
  it('counts members, the number in bold', () => {
    renderWithIntl(<MemberCount count={1204} slug="macro" handle="#macro" />)
    expect(screen.getByText('1,204').tagName).toBe('STRONG')
    // A button to the members (specs/community-members CM-01).
    expect(screen.getByRole('button', { name: '1,204 members' })).toHaveAttribute(
      'aria-haspopup',
      'dialog',
    )
  })

  it('shows followers and following in one line; the rest is in the card (specs/profile-aside PA-02)', () => {
    renderWithIntl(
      <ProfileStats profile={profileDetails({ followerCount: 1, followingCount: 48 })} />,
    )
    const line = screen.getByRole('paragraph')
    expect(line).toHaveTextContent('1 follower 48 following')
    expect(line).not.toHaveTextContent(/accuracy|streak/)
    expect(screen.getByText('48').tagName).toBe('STRONG')
    // Followers and following open their lists (specs/follow-lists FL-01).
    expect(screen.getByRole('button', { name: '48 following' })).toHaveAttribute(
      'aria-haspopup',
      'dialog',
    )
    expect(screen.getByRole('button', { name: '1 follower' })).toBeInTheDocument()
  })
})

describe('TrackRecord (specs/profile-track-record PT-02, PT-03)', () => {
  it('counts correct, incorrect and cancelled, with ✓ and ✗ besides the color', () => {
    const { container } = renderWithIntl(
      <TrackRecord profile={profileDetails({ cancelledCount: 0 })} />,
    )
    expect(screen.getByRole('paragraph')).toHaveTextContent(/9 correct\s*3 incorrect\s*0 cancelled/)
    expect(container.querySelectorAll('svg')).toHaveLength(2)
  })

  it('says there is no resolved thesis yet instead of zeros', () => {
    renderWithIntl(<TrackRecord profile={profileDetails({ correctCount: 0, incorrectCount: 0 })} />)
    expect(screen.getByText('No resolved theses yet')).toBeInTheDocument()
    expect(screen.queryByText(/correct/)).not.toBeInTheDocument()
  })
})
