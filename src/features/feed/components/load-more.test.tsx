import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { parseFeedParams } from '../schemas/feed-params.schema'
import { LoadMore } from './load-more'

const action = vi.hoisted(() => ({ loadMoreFeed: vi.fn() }))
vi.mock('../actions/load-more-feed.action', () => action)

/** jsdom has no IntersectionObserver: a stand-in that lets the test scroll the button into view. */
const observers: Array<(entries: Array<{ isIntersecting: boolean }>) => void> = []
class FakeObserver {
  constructor(callback: (entries: Array<{ isIntersecting: boolean }>) => void) {
    observers.push(callback)
  }
  observe() {}
  disconnect() {}
}

const page = (label: string, nextCursor: string | null) => ({
  ok: true,
  data: { items: <li>{label}</li>, count: 1, nextCursor },
})

describe('LoadMore (H-16)', () => {
  beforeEach(() => {
    action.loadMoreFeed.mockReset()
    observers.length = 0
    vi.stubGlobal('IntersectionObserver', FakeObserver)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('appends the next page when pressed, with the feed state, cursor and locale', async () => {
    action.loadMoreFeed.mockResolvedValue(page('Card 21', 'c2'))
    renderWithIntl(<LoadMore params={parseFeedParams({ filter: 'polls' })} cursor="c1" />)

    await userEvent.click(screen.getByRole('button', { name: 'Load more' }))
    expect(await screen.findByText('Card 21')).toBeInTheDocument()
    expect(action.loadMoreFeed).toHaveBeenCalledWith({
      feed: 'for-you',
      filter: 'polls',
      community: undefined,
      cursor: 'c1',
      locale: 'en',
    })
    expect(screen.getByRole('status')).toHaveTextContent('1 more item loaded')
  })

  it('loads by itself when the button scrolls into view, and follows the cursor', async () => {
    action.loadMoreFeed.mockResolvedValueOnce(page('Card 21', 'c2'))
    action.loadMoreFeed.mockResolvedValueOnce(page('Card 41', null))
    renderWithIntl(<LoadMore params={parseFeedParams({})} cursor="c1" />)

    await act(async () => observers.at(-1)!([{ isIntersecting: true }]))
    expect(await screen.findByText('Card 21')).toBeInTheDocument()
    await act(async () => observers.at(-1)!([{ isIntersecting: true }]))
    expect(await screen.findByText('Card 41')).toBeInTheDocument()
    expect(action.loadMoreFeed).toHaveBeenLastCalledWith(expect.objectContaining({ cursor: 'c2' }))
  })

  it('disappears when there are no more pages', async () => {
    action.loadMoreFeed.mockResolvedValue(page('Last card', null))
    renderWithIntl(<LoadMore params={parseFeedParams({})} cursor="c1" />)

    await userEvent.click(screen.getByRole('button', { name: 'Load more' }))
    await screen.findByText('Last card')
    expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull()
  })

  it('says when it fails and lets the person retry by hand', async () => {
    action.loadMoreFeed
      .mockResolvedValueOnce({ ok: false, error: 'api.errors.UNAVAILABLE' })
      .mockResolvedValueOnce(page('Card 21', null))
    renderWithIntl(<LoadMore params={parseFeedParams({})} cursor="c1" />)

    await userEvent.click(screen.getByRole('button', { name: 'Load more' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load more')
    await userEvent.click(screen.getByRole('button', { name: 'Load more' }))
    expect(await screen.findByText('Card 21')).toBeInTheDocument()
  })

  it('is reachable with the keyboard', async () => {
    action.loadMoreFeed.mockResolvedValue(page('Card 21', null))
    renderWithIntl(<LoadMore params={parseFeedParams({})} cursor="c1" />)

    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Load more' })).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(await screen.findByText('Card 21')).toBeInTheDocument()
  })

  it('moves focus to the first new card after a load asked by hand (WCAG 2.4.3)', async () => {
    action.loadMoreFeed.mockResolvedValue({
      ok: true,
      data: {
        items: (
          <li>
            <article aria-label="Card 21">Card 21</article>
          </li>
        ),
        count: 1,
        nextCursor: null,
      },
    })
    renderWithIntl(<LoadMore params={parseFeedParams({})} cursor="c1" />)

    await userEvent.click(screen.getByRole('button', { name: 'Load more' }))
    expect(await screen.findByRole('article', { name: 'Card 21' })).toHaveFocus()
  })

  it('does not steal the focus after a load triggered by scrolling', async () => {
    action.loadMoreFeed.mockResolvedValue({
      ok: true,
      data: {
        items: (
          <li>
            <article aria-label="Card 21">Card 21</article>
          </li>
        ),
        count: 1,
        nextCursor: 'c2',
      },
    })
    renderWithIntl(<LoadMore params={parseFeedParams({})} cursor="c1" />)

    await act(async () => observers.at(-1)!([{ isIntersecting: true }]))
    expect(await screen.findByRole('article', { name: 'Card 21' })).not.toHaveFocus()
  })
})
