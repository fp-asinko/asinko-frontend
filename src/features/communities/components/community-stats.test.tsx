import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { profileDetails } from '../profile.fixture'
import { MemberCount, ProfileStats } from './community-stats'

describe('community stats (specs/community-pages CP-11)', () => {
  it('counts members, the number in bold', () => {
    renderWithIntl(<MemberCount count={1204} />)
    expect(screen.getByText('1,204').tagName).toBe('STRONG')
    expect(screen.getByText('1,204').closest('p')).toHaveTextContent('1,204 members')
  })

  it('shows following and followers, then the track record (specs/profile-track-record PT-01, PT-02)', () => {
    renderWithIntl(
      <ProfileStats profile={profileDetails({ followerCount: 1, followingCount: 48 })} />,
    )
    const [people, record] = screen.getAllByRole('paragraph')
    expect(people).toHaveTextContent('48 following·1 follower')
    expect(record).toHaveTextContent(
      /75% accuracy·3 streak·\s*9 correct·\s*3 incorrect·1 cancelled/,
    )
    expect(screen.getByText('9').tagName).toBe('STRONG')
  })

  it('leaves out an unknown accuracy and no cancelled theses', () => {
    renderWithIntl(
      <ProfileStats profile={profileDetails({ accuracyRate: null, cancelledCount: 0 })} />,
    )
    expect(screen.queryByText(/accuracy/)).not.toBeInTheDocument()
    expect(screen.queryByText(/cancelled/)).not.toBeInTheDocument()
  })

  it('says there is no resolved thesis yet instead of zeros (PT-03)', () => {
    renderWithIntl(
      <ProfileStats
        profile={profileDetails({ correctCount: 0, incorrectCount: 0, accuracyRate: null })}
      />,
    )
    expect(screen.getByText('No resolved theses yet')).toBeInTheDocument()
    expect(screen.queryByText(/correct/)).not.toBeInTheDocument()
  })
})
