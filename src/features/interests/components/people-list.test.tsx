import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { PeopleList } from './people-list'

// Its stars call a Server Action, which needs the env: not here (testing.md § Mocks).
vi.mock('@/lib/communities/set-favorite.action', () => ({ setFavorite: vi.fn() }))

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

describe('PeopleList (H-07)', () => {
  it('shows each person as @handle with the accuracy, linking to the profile (CP-21)', () => {
    renderWithIntl(
      <PeopleList
        people={[
          {
            handle: '@maria',
            path: '/user/maria',
            id: '1',
            username: 'maria',
            avatarUrl: null,
            accuracyRate: 0.74,
            channelSlug: 'maria',
            favorite: false,
          },
          {
            handle: '@ana',
            path: '/user/ana',
            id: '2',
            username: 'ana',
            avatarUrl: null,
            accuracyRate: null,
            channelSlug: 'maria',
            favorite: false,
          },
        ]}
      />,
    )
    expect(screen.getByText('maria')).toBeInTheDocument()
    expect(screen.getByText('ana')).toBeInTheDocument()
    expect(screen.getByText('74% accuracy')).toBeInTheDocument()
    expect(screen.getAllByText(/accuracy/)).toHaveLength(1)
    expect(screen.getByRole('link', { name: /maria/ })).toHaveAttribute('href', '/user/maria')
  })
})

describe('PeopleList, the accuracy in its tier (specs/interests-refresh IR-04)', () => {
  const person = (id: string, accuracyRate: number) => ({
    handle: `@${id}`,
    path: `/user/${id}`,
    id,
    username: id,
    avatarUrl: null,
    accuracyRate,
    channelSlug: id,
    favorite: false,
  })

  it('tints it green from 70%, amber from 50% and red below, as the cards', () => {
    renderWithIntl(
      <PeopleList people={[person('high', 0.85), person('mid', 0.6), person('low', 0.3)]} />,
    )
    const tierOf = (text: string) =>
      screen.getByText(text, { selector: '[aria-hidden]' }).parentElement!.dataset.tier
    expect(tierOf('85%')).toBe('high')
    expect(tierOf('60%')).toBe('mid')
    expect(tierOf('30%')).toBe('low')
  })

  it('shows 3, 4 or 5 people by the column height, all of them with "more" open (SF-03, PO 2026-11-12)', () => {
    renderWithIntl(<PeopleList people={[]} id="people-list" />)
    expect(screen.getByRole('list')).toHaveClass(
      '[&>li:nth-child(n+6)]:hidden',
      'column-tall:[&>li:nth-child(n+5)]:hidden',
      'column-short:[&>li:nth-child(n+4)]:hidden',
      'group-has-data-[more=open]/section:[&>li]:flex!',
    )
  })
})
