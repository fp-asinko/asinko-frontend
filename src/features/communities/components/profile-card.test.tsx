import { screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import type { ActiveCommunity } from '../communities.types'
import { profileDetails } from '../profile.fixture'
import { ProfileCard } from './profile-card'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

const community = (handle: string, postCount: number): ActiveCommunity => ({
  handle,
  path: `/hub/${handle.slice(1)}`,
  avatarUrl: null,
  colorKey: handle.slice(1),
  kind: 'group',
  postCount,
})

function renderCard(profile = {}, communities: ActiveCommunity[] = []) {
  renderWithIntl(
    <ProfileCard
      profile={profileDetails({
        username: 'maria',
        displayName: 'María Ruiz',
        accuracyRate: 0.74,
        currentStreak: 3,
        correctCount: 17,
        incorrectCount: 6,
        points: 12400,
        joinedAt: '2025-03-10T12:00:00.000Z',
        ...profile,
      })}
      communities={communities}
      idPrefix="card"
    />,
  )
  return screen.getByRole('region', { name: 'María Ruiz' })
}

/** A number of the card by its label: the definition of its term. */
function stat(card: HTMLElement, label: string) {
  const terms = within(card).getAllByRole('term')
  const index = terms.findIndex((term) => term.textContent === label)
  return within(card).getAllByRole('definition')[index]
}

describe('ProfileCard (specs/profile-aside PA-01)', () => {
  it('shows the numbers of their reputation, without repeating the photo and name (PO, 2026-10-21)', () => {
    const card = renderCard()
    // Named for who navigates by regions, but not shown: the header already does.
    expect(within(card).getByRole('heading', { level: 2 })).toHaveClass('sr-only')
    expect(within(card).queryByRole('img')).toBeNull()
    expect(stat(card, 'Accuracy')).toHaveTextContent('74%')
    expect(stat(card, 'Streak')).toHaveTextContent('3')
    expect(stat(card, 'Correct')).toHaveTextContent('17')
    expect(stat(card, 'Incorrect')).toHaveTextContent('6')
    expect(stat(card, 'Points')).toHaveTextContent('12,400')
    expect(stat(card, 'Member since')).toHaveTextContent('Mar 2025')
  })

  it('says there is no resolved thesis instead of an accuracy', () => {
    const card = renderCard({ accuracyRate: null })
    expect(stat(card, 'Accuracy')).toHaveTextContent('No resolved theses')
  })

  it('takes more sections at its end (the achievements)', () => {
    renderWithIntl(
      <ProfileCard profile={profileDetails()} communities={[]} idPrefix="t">
        <section aria-label="More">More</section>
      </ProfileCard>,
    )
    expect(screen.getByRole('region', { name: 'More' })).toBeInTheDocument()
  })

  it('shows where they publish, with how many posts', () => {
    const card = renderCard({}, [community('#macro', 12), community('#defi', 1)])
    const active = within(card).getByRole('region', { name: 'Participates in' })
    expect(within(active).getByRole('link', { name: '#macro 12 posts' })).toHaveAttribute(
      'href',
      '/hub/macro',
    )
    expect(within(active).getByRole('link', { name: '#defi 1 post' })).toBeInTheDocument()
  })
})
