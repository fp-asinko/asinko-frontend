import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { AchievementsList } from './achievements-list'
import { EARNED, MISSING } from './achievements.fixture'

const group = (name: string) => screen.getByRole('region', { name })
const names = (name: string) =>
  within(group(name))
    .getAllByRole('heading', { level: 3 })
    .map((heading) => heading.textContent)

describe('AchievementsList (specs/profile-achievements AC-06, AC-07, AC-09)', () => {
  it('in its groups, the earned ones first with their date, then the missing ones', () => {
    renderWithIntl(<AchievementsList achievements={[...EARNED, ...MISSING]} />)
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Theses and reputation',
      'Community',
      'Tenure',
      'Profile',
    ])
    expect(names('Theses and reputation')).toEqual([
      'Streak of 3',
      'First hit',
      'Streak of 5',
      '70% accuracy',
    ])
    const streak = within(group('Theses and reputation')).getAllByRole('listitem')[0]!
    expect(within(streak).getByText('3 correct theses in a row.')).toBeInTheDocument()
    expect(streak.querySelector('time')).toHaveAttribute('datetime', '2026-10-10T12:00:00.000Z')
    expect(streak).toHaveTextContent('Earned Oct 10, 2026')
  })

  it('a missing one says "Locked" in words and how far it is', () => {
    renderWithIntl(<AchievementsList achievements={MISSING} />)
    const missing = within(group('Profile')).getByRole('listitem')
    expect(missing).toHaveTextContent('Locked')
    expect(within(missing).getByRole('progressbar')).toHaveAttribute('aria-valuetext', '3 of 8')
  })

  it('leaves out a group without any', () => {
    renderWithIntl(<AchievementsList achievements={EARNED} />)
    expect(screen.queryByRole('region', { name: 'Profile' })).toBeNull()
    expect(names('Tenure')).toEqual(['2 years on Asinko'])
  })
})
