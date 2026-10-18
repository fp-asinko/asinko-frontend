import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { RepliesLoadMore } from './replies-load-more'

const action = vi.hoisted(() => ({ loadMoreReplies: vi.fn() }))
vi.mock('../actions/load-more-replies.action', () => action)

const USER = '00000000-0000-4000-8000-000000000101'

describe('RepliesLoadMore (specs/backend-adoption BK-03)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('appends the next page, announces it, focuses its first reply and goes away at the end', async () => {
    action.loadMoreReplies.mockResolvedValue({
      ok: true,
      data: {
        items: (
          <li>
            <article aria-label="Old call">Old call</article>
          </li>
        ),
        count: 1,
        nextCursor: null,
      },
    })
    renderWithIntl(<RepliesLoadMore userId={USER} cursor="c2" />)
    await userEvent.click(screen.getByRole('button', { name: 'Load more' }))

    expect(action.loadMoreReplies).toHaveBeenCalledWith({
      userId: USER,
      cursor: 'c2',
      locale: 'en',
    })
    expect(await screen.findByRole('article', { name: 'Old call' })).toHaveFocus()
    expect(screen.getByRole('status')).toHaveTextContent('1 more reply loaded')
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument()
  })

  it('says when it fails and keeps the button to retry', async () => {
    action.loadMoreReplies.mockResolvedValue({ ok: false, error: 'api.errors.UNAVAILABLE' })
    renderWithIntl(<RepliesLoadMore userId={USER} cursor="c2" />)
    await userEvent.click(screen.getByRole('button', { name: 'Load more' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load more')
    expect(screen.getByRole('button', { name: 'Load more' })).toBeInTheDocument()
  })
})
