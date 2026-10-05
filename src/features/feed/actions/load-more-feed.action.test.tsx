import { beforeEach, describe, expect, it, vi } from 'vitest'
import { postItem } from '../feed-items.fixture'
import { loadMoreFeed } from './load-more-feed.action'

const deps = vi.hoisted(() => ({
  getFeed: vi.fn(),
  setRequestLocale: vi.fn(),
  getViewer: vi.fn(async () => null as { id: string } | null),
}))
vi.mock('../lib/feed-api', () => ({ getFeed: deps.getFeed }))
vi.mock('next-intl/server', () => ({ setRequestLocale: deps.setRequestLocale }))
vi.mock('@/lib/session', () => ({ getViewer: deps.getViewer }))
// The cards have their own tests; here only validation and paging matter.
vi.mock('../components/feed-items', () => ({ FeedItems: () => null }))

describe('loadMoreFeed (H-16)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects input without a cursor or with an unknown locale', async () => {
    for (const raw of [
      null,
      { locale: 'en' },
      { cursor: 'c1', locale: 'fr' },
      { cursor: '', locale: 'en' },
    ]) {
      expect(await loadMoreFeed(raw)).toEqual({ ok: false, error: 'api.errors.INVALID' })
    }
    expect(deps.getFeed).not.toHaveBeenCalled()
  })

  it('asks for the next page with the validated feed state and renders it', async () => {
    deps.getFeed.mockResolvedValue({
      ok: true,
      data: { items: [postItem(), postItem({ id: 'post-2' })], nextCursor: 'c3', community: null },
    })
    const result = await loadMoreFeed({ feed: 'nope', filter: 'polls', cursor: 'c2', locale: 'es' })

    expect(deps.setRequestLocale).toHaveBeenCalledWith('es')
    expect(deps.getFeed).toHaveBeenCalledWith(
      { feed: 'for-you', filter: 'polls', community: undefined },
      'c2',
      { signedIn: false },
    )
    expect(result).toMatchObject({ ok: true, data: { count: 2, nextCursor: 'c3' } })
  })

  it('tells getFeed whether there is a session, for the join buttons (CF-12)', async () => {
    deps.getViewer.mockResolvedValueOnce({ id: 'viewer' })
    deps.getFeed.mockResolvedValue({
      ok: true,
      data: { items: [], nextCursor: null, community: null },
    })
    await loadMoreFeed({ cursor: 'c2', locale: 'en' })
    expect(deps.getFeed).toHaveBeenCalledWith(expect.anything(), 'c2', { signedIn: true })
  })

  it('returns the translation key of a failure', async () => {
    deps.getFeed.mockResolvedValue({
      ok: false,
      kind: 'expected',
      code: 'INVALID',
      errorKey: 'api.errors.INVALID',
      endpoint: 'GET /api/v1/feed/explore',
    })
    expect(await loadMoreFeed({ cursor: 'bad cursor', locale: 'en' })).toEqual({
      ok: false,
      error: 'api.errors.INVALID',
    })
  })
})
