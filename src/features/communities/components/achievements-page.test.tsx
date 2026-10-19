import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { EARNED, MISSING } from './achievements.fixture'
import { AchievementsView } from './achievements-page'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))
// The view only; reading and metadata (server) are covered by e2e.
vi.mock('@/env', () => ({ env: {} }))
vi.mock('../lib/achievements-api', () => ({ getAchievements: vi.fn() }))
vi.mock('../lib/profile-api', () => ({ getProfileDetails: vi.fn() }))

const MARIA = { username: 'maria', displayName: 'María', avatarUrl: null, isSelf: false }

describe('AchievementsView (specs/profile-achievements AC-06 to AC-08)', () => {
  it('leads back to the profile, titles the page and lists them', () => {
    renderWithIntl(<AchievementsView profile={MARIA} achievements={EARNED} />)
    expect(screen.getByRole('link', { name: "Back to María's profile" })).toHaveAttribute(
      'href',
      '/user/maria',
    )
    expect(
      screen.getByRole('heading', { level: 1, name: "María's achievements" }),
    ).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Theses and reputation' })).toBeInTheDocument()
  })

  it('says someone else has none; your own shows what is missing', () => {
    const { unmount } = renderWithIntl(<AchievementsView profile={MARIA} achievements={[]} />)
    expect(screen.getByText('María has no achievements yet.')).toBeInTheDocument()
    unmount()
    renderWithIntl(<AchievementsView profile={{ ...MARIA, isSelf: true }} achievements={MISSING} />)
    expect(screen.getByRole('region', { name: 'Profile' })).toHaveTextContent('Locked')
  })

  it('says it could not load them', () => {
    renderWithIntl(<AchievementsView profile={MARIA} achievements={null} />)
    expect(screen.getByText("Couldn't load the achievements.")).toBeInTheDocument()
  })
})
