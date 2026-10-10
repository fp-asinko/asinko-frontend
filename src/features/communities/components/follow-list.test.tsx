import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { FollowList } from './follow-list'

const action = vi.hoisted(() => ({ loadPeople: vi.fn() }))
vi.mock('../actions/load-people.action', () => action)

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
  renderWithIntl(
    <FollowList source={{ list: kind, userId: USER }} handle="@maria" isSelf={isSelf} />,
  )
}

describe('FollowList (specs/follow-lists FL-03, FL-04)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows a skeleton, then the first page in a named list, then more on demand', async () => {
    action.loadPeople
      .mockResolvedValueOnce(page(['ana', 'bruno'], 'c2'))
      .mockResolvedValueOnce(page(['carla']))
    renderList()
    expect(screen.getByRole('status')).toHaveTextContent('Loading…')
    const list = await screen.findByRole('list', { name: 'Followers of @maria' }, { timeout: 5000 })
    expect(list).toHaveTextContent('anabruno')
    expect(action.loadPeople).toHaveBeenCalledWith({
      source: { list: 'followers', userId: USER },
      cursor: undefined,
      locale: 'en',
    })
    await userEvent.click(
      await screen.findByRole('button', { name: 'Load more' }, { timeout: 5000 }),
    )
    expect(await screen.findByText('carla', {}, { timeout: 5000 })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('1 more loaded')
    expect(action.loadPeople).toHaveBeenLastCalledWith(expect.objectContaining({ cursor: 'c2' }))
    expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull()
  })

  it('says when nobody is there, in second person on your own profile', async () => {
    action.loadPeople.mockResolvedValue(page([]))
    renderList(false, 'following')
    expect(
      await screen.findByText('@maria does not follow anyone yet.', {}, { timeout: 5000 }),
    ).toBeInTheDocument()
  })

  it('speaks to you on your own profile', async () => {
    action.loadPeople.mockResolvedValue(page([]))
    renderList(true)
    expect(
      await screen.findByText('You have no followers yet.', {}, { timeout: 5000 }),
    ).toBeInTheDocument()
  })

  it('offers to retry when the list fails', async () => {
    action.loadPeople
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
    action.loadPeople
      .mockResolvedValueOnce(page(['ana'], 'c2'))
      .mockReturnValueOnce(new Promise((resolve) => (finish = resolve)))
    renderList()
    const more = await screen.findByRole('button', { name: 'Load more' })
    await userEvent.click(more)
    await userEvent.click(more)
    finish(page(['bruno']))
    expect(await screen.findByText('bruno')).toBeInTheDocument()
    expect(action.loadPeople).toHaveBeenCalledTimes(2)
  })

  it("names a community's members and says when there are none (specs/community-members CM-04)", async () => {
    action.loadPeople.mockResolvedValueOnce(page(['ana'])).mockResolvedValueOnce(page([]))
    const { unmount } = renderWithIntl(
      <FollowList source={{ list: 'members', slug: 'defi' }} handle="#defi" isSelf={false} />,
    )
    expect(
      await screen.findByRole('list', { name: 'Members of #defi' }, { timeout: 5000 }),
    ).toHaveTextContent('ana')
    expect(action.loadPeople).toHaveBeenCalledWith(
      expect.objectContaining({ source: { list: 'members', slug: 'defi' } }),
    )
    unmount()
    renderWithIntl(
      <FollowList source={{ list: 'members', slug: 'defi' }} handle="#defi" isSelf={false} />,
    )
    expect(
      await screen.findByText('#defi has no members yet.', {}, { timeout: 5000 }),
    ).toBeInTheDocument()
  })
})
