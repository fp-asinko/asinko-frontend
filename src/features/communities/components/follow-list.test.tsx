import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { FollowList } from './follow-list'

const action = vi.hoisted(() => ({ loadFollowList: vi.fn() }))
vi.mock('../actions/load-follow-list.action', () => action)

const USER = '00000000-0000-4000-8000-000000000101'
const page = (names: string[], nextCursor: string | null = null) => ({
  ok: true,
  data: {
    items: names.map((name) => <li key={name}>{name}</li>),
    count: names.length,
    nextCursor,
  },
})

function renderList(isSelf = false, kind: 'followers' | 'following' = 'followers') {
  renderWithIntl(<FollowList userId={USER} kind={kind} handle="@maria" isSelf={isSelf} />)
}

describe('FollowList (specs/follow-lists FL-03, FL-04)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows a skeleton, then the first page in a named list, then more on demand', async () => {
    action.loadFollowList
      .mockResolvedValueOnce(page(['ana', 'bruno'], 'c2'))
      .mockResolvedValueOnce(page(['carla']))
    renderList()
    expect(screen.getByRole('status')).toHaveTextContent('Loading…')
    const list = await screen.findByRole('list', { name: 'Followers of @maria' }, { timeout: 5000 })
    expect(list).toHaveTextContent('anabruno')
    expect(action.loadFollowList).toHaveBeenCalledWith({
      userId: USER,
      kind: 'followers',
      cursor: undefined,
      locale: 'en',
    })
    await userEvent.click(
      await screen.findByRole('button', { name: 'Load more' }, { timeout: 5000 }),
    )
    expect(await screen.findByText('carla', {}, { timeout: 5000 })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('1 more loaded')
    expect(action.loadFollowList).toHaveBeenLastCalledWith(
      expect.objectContaining({ cursor: 'c2' }),
    )
    expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull()
  })

  it('says when nobody is there, in second person on your own profile', async () => {
    action.loadFollowList.mockResolvedValue(page([]))
    renderList(false, 'following')
    expect(
      await screen.findByText('@maria does not follow anyone yet.', {}, { timeout: 5000 }),
    ).toBeInTheDocument()
  })

  it('speaks to you on your own profile', async () => {
    action.loadFollowList.mockResolvedValue(page([]))
    renderList(true)
    expect(
      await screen.findByText('You have no followers yet.', {}, { timeout: 5000 }),
    ).toBeInTheDocument()
  })

  it('offers to retry when the list fails', async () => {
    action.loadFollowList
      .mockResolvedValueOnce({ ok: false, error: 'api.errors.UNAVAILABLE' })
      .mockResolvedValueOnce(page(['ana']))
    renderList()
    const retry = await screen.findByRole('button', { name: 'Retry' }, { timeout: 5000 })
    // Said, not only shown.
    expect(screen.getByRole('status')).toHaveTextContent('Could not load the list.')
    await userEvent.click(retry)
    expect(await screen.findByText('ana', {}, { timeout: 5000 })).toBeInTheDocument()
  })

  it('asks for each page once, even when asked twice at the same time', async () => {
    let finish!: (value: unknown) => void
    action.loadFollowList
      .mockResolvedValueOnce(page(['ana'], 'c2'))
      .mockReturnValueOnce(new Promise((resolve) => (finish = resolve)))
    renderList()
    const more = await screen.findByRole('button', { name: 'Load more' })
    await userEvent.click(more)
    await userEvent.click(more)
    finish(page(['bruno']))
    expect(await screen.findByText('bruno')).toBeInTheDocument()
    expect(action.loadFollowList).toHaveBeenCalledTimes(2)
  })
})
