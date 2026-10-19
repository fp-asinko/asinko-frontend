import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import type { ActiveCommunity } from '../communities.types'
import { ActiveCommunities } from './active-communities'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

const community = (handle: string, postCount: number): ActiveCommunity => ({
  handle,
  path: `/hub/${handle.slice(1)}`,
  avatarUrl: null,
  colorKey: handle.slice(1),
  kind: 'group',
  postCount,
})

describe('ActiveCommunities (specs/profile-aside PA-05)', () => {
  it('lists where the person publishes, each with how many posts and its page', () => {
    renderWithIntl(
      <ActiveCommunities
        communities={[community('#macro', 12), community('#defi', 1)]}
        idPrefix="x"
      />,
    )
    const active = screen.getByRole('region', { name: 'Participates in' })
    expect(within(active).getByRole('link', { name: '#macro 12 posts' })).toHaveAttribute(
      'href',
      '/hub/macro',
    )
    expect(within(active).getByRole('link', { name: '#defi 1 post' })).toBeInTheDocument()
  })

  it('shows five and folds the rest under See all', async () => {
    renderWithIntl(
      <ActiveCommunities
        communities={Array.from({ length: 7 }, (_, n) => community(`#c${n}`, 10 - n))}
        idPrefix="x"
      />,
    )
    const details = screen.getByText('See all (7)').closest('details')!
    expect(details).not.toHaveAttribute('open')
    await userEvent.click(screen.getByText('See all (7)'))
    expect(details).toHaveAttribute('open')
    expect(within(details).getAllByRole('link')).toHaveLength(2)
  })

  it('is not there without posts lately', () => {
    renderWithIntl(<ActiveCommunities communities={[]} idPrefix="x" />)
    expect(screen.queryByRole('region')).toBeNull()
  })
})
