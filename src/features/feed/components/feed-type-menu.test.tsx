import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { router } from '@/test/navigation-mock'
import { renderWithIntl } from '@/test/render-with-intl'
import { parseFeedParams } from '../schemas/feed-params.schema'
import { FeedTypeMenu } from './feed-type-menu'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

describe('FeedTypeMenu (specs/feed-type-filter FT-04 to FT-07)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('says the type, and opens All, Posts, Theses and Polls with the current one checked', async () => {
    renderWithIntl(<FeedTypeMenu params={parseFeedParams({})} />)
    await userEvent.click(screen.getByRole('button', { name: 'Content type: All' }))
    const menu = await screen.findByRole('menu', {}, { timeout: 8000 })
    const items = within(menu).getAllByRole('menuitemradio')
    expect(items.map((item) => item.textContent)).toEqual(['All', 'Posts', 'Theses', 'Polls'])
    expect(within(menu).getByRole('menuitemradio', { name: 'All' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
  })

  it('puts the type in the URL, keeping the tab and the community; All without it', async () => {
    const { unmount } = renderWithIntl(
      <FeedTypeMenu params={parseFeedParams({ community: 'BTC' })} />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Content type: All' }))
    await userEvent.click(
      await screen.findByRole('menuitemradio', { name: 'Theses' }, { timeout: 8000 }),
    )
    expect(router.push).toHaveBeenCalledWith(
      { pathname: '/', query: { type: 'theses', community: 'BTC' } },
      { scroll: false },
    )
    // Chosen, the menu closes (a radio item alone would keep it open).
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
    unmount()

    renderWithIntl(<FeedTypeMenu params={parseFeedParams({ feed: 'following', type: 'polls' })} />)
    await userEvent.click(screen.getByRole('button', { name: 'Content type: Polls' }))
    await userEvent.click(
      await screen.findByRole('menuitemradio', { name: 'All' }, { timeout: 8000 }),
    )
    expect(router.push).toHaveBeenLastCalledWith(
      { pathname: '/', query: { feed: 'following' } },
      { scroll: false },
    )
  })

  it('stays on a community page (FT-11)', async () => {
    renderWithIntl(<FeedTypeMenu params={parseFeedParams({})} pagePath="/asset/BTC" />)
    await userEvent.click(screen.getByRole('button', { name: 'Content type: All' }))
    await userEvent.click(
      await screen.findByRole('menuitemradio', { name: 'Polls' }, { timeout: 8000 }),
    )
    expect(router.push).toHaveBeenCalledWith(
      { pathname: '/asset/BTC', query: { type: 'polls' } },
      { scroll: false },
    )
  })
})
