import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { MemberCount, ProfileStats } from './community-stats'

describe('community stats (specs/community-pages CP-11)', () => {
  it('counts members, the number in bold', () => {
    renderWithIntl(<MemberCount count={1204} />)
    expect(screen.getByText('1,204').tagName).toBe('STRONG')
    expect(screen.getByText('1,204').closest('p')).toHaveTextContent('1,204 members')
  })

  it('shows followers, accuracy and streak, leaving out an unknown accuracy', () => {
    const { rerender } = renderWithIntl(
      <ProfileStats profile={{ followerCount: 1, accuracyRate: 0.5, currentStreak: 2 }} />,
    )
    const stats = screen.getByText('1').closest('p')!
    expect(stats).toHaveTextContent('1 follower')
    expect(stats).toHaveTextContent('50% accuracy')
    expect(stats).toHaveTextContent('2 streak')

    rerender(<ProfileStats profile={{ followerCount: 1, accuracyRate: null, currentStreak: 2 }} />)
    expect(screen.queryByText(/accuracy/)).not.toBeInTheDocument()
  })
})
