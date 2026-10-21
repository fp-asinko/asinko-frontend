import { screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { AchievementsCard, closestAchievement } from './achievements-card'
import { EARNED, MISSING } from './achievements.fixture'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

function renderCard(
  achievements: Parameters<typeof AchievementsCard>[0]['achievements'],
  isSelf = false,
) {
  return renderWithIntl(
    <AchievementsCard
      achievements={achievements}
      isSelf={isSelf}
      name="María"
      achievementsPath="/user/maria/achievements"
      idPrefix="test"
    />,
  )
}

describe('AchievementsCard (specs/profile-achievements AC-03, AC-04)', () => {
  it('says how many, shows the last four earned and leads to all of them', () => {
    renderCard([...EARNED, ...MISSING], true)
    const card = screen.getByRole('region', { name: 'Achievements · 5' })
    expect(
      within(card)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual([
      'Streak of 3Earned Oct 2026',
      '2 years on AsinkoEarned Sep 2026',
      'Moderates a groupEarned Sep 2026',
      'First hitEarned Aug 2026',
    ])
    // A row each, with when it was earned (PO, 2026-10-21).
    expect(within(card).getAllByRole('listitem')[0]!.querySelector('time')).toHaveAttribute(
      'datetime',
      '2026-10-10T12:00:00.000Z',
    )
    expect(
      within(card).getByRole('link', { name: "See all of María's achievements" }),
    ).toHaveAttribute('href', '/user/maria/achievements')
  })

  it('on your own profile with none, the closest one with its progress', () => {
    renderCard(MISSING, true)
    const card = screen.getByRole('region', { name: 'Achievements' })
    expect(within(card).getByText('You have no achievements yet')).toBeInTheDocument()
    expect(within(card).getByText(/^70% accuracy/)).toHaveTextContent('70% accuracy, Locked')
    expect(within(card).getByRole('progressbar')).toHaveAttribute('aria-valuetext', '62% of 70%')
  })

  it("is not there on someone else's profile without any", () => {
    const { container } = renderCard([])
    expect(container).toBeEmptyDOMElement()
  })

  it('says it could not load them, without a link', () => {
    renderCard(null)
    expect(screen.getByText("Couldn't load the achievements.")).toBeInTheDocument()
    expect(screen.queryByRole('link')).toBeNull()
  })
})

describe('closestAchievement', () => {
  it('the most advanced missing one; without progress, the first', () => {
    expect(closestAchievement(MISSING)?.code).toBe('ACCURACY_70')
    expect(closestAchievement([MISSING[2]!])?.code).toBe('FOUNDING_MEMBER')
    expect(closestAchievement(EARNED)).toBeUndefined()
  })
})
