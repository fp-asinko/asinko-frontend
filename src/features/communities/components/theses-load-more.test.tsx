import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { ThesesLoadMore } from './theses-load-more'

const action = vi.hoisted(() => ({ loadMoreTheses: vi.fn() }))
vi.mock('../actions/load-more-theses.action', () => action)

const USER = '00000000-0000-4000-8000-000000000101'

describe('ThesesLoadMore (specs/profile-track-record PT-05)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('appends the next page, announces it, focuses its first thesis and goes away at the end', async () => {
    action.loadMoreTheses.mockResolvedValue({
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
    renderWithIntl(<ThesesLoadMore userId={USER} cursor="c2" />)
    await userEvent.click(screen.getByRole('button', { name: 'Load more' }))

    expect(action.loadMoreTheses).toHaveBeenCalledWith({ userId: USER, cursor: 'c2', locale: 'en' })
    expect(await screen.findByRole('article', { name: 'Old call' })).toHaveFocus()
    expect(screen.getByRole('status')).toHaveTextContent('1 more thesis loaded')
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument()
  })

  it('says when it fails and keeps the button to retry', async () => {
    action.loadMoreTheses.mockResolvedValue({ ok: false, error: 'api.errors.UNAVAILABLE' })
    renderWithIntl(<ThesesLoadMore userId={USER} cursor="c2" />)
    await userEvent.click(screen.getByRole('button', { name: 'Load more' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load more')
    expect(screen.getByRole('button', { name: 'Load more' })).toBeInTheDocument()
  })
})
