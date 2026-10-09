import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { profileDetails } from '../profile.fixture'
import { MemberCount, ProfileStats, TrackRecord } from './community-stats'

describe('community stats (specs/community-pages CP-11)', () => {
  it('counts members, the number in bold', () => {
    renderWithIntl(<MemberCount count={1204} />)
    expect(screen.getByText('1,204').tagName).toBe('STRONG')
    expect(screen.getByText('1,204').closest('p')).toHaveTextContent('1,204 members')
  })

  it('shows followers, following, accuracy and streak in one line (specs/profile-track-record PT-01)', () => {
    renderWithIntl(
      <ProfileStats profile={profileDetails({ followerCount: 1, followingCount: 48 })} />,
    )
    const line = screen.getByRole('paragraph')
    expect(line).toHaveTextContent('1 follower 48 following 75% accuracy 3 streak')
    expect(screen.getByText('48').tagName).toBe('STRONG')
    // Followers and following open their lists (specs/follow-lists FL-01).
    expect(screen.getByRole('button', { name: '48 following' })).toHaveAttribute(
      'aria-haspopup',
      'dialog',
    )
    expect(screen.getByRole('button', { name: '1 follower' })).toBeInTheDocument()
  })

  it('leaves out an unknown accuracy', () => {
    renderWithIntl(<ProfileStats profile={profileDetails({ accuracyRate: null })} />)
    expect(screen.queryByText(/accuracy/)).not.toBeInTheDocument()
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
