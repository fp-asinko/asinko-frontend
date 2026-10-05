import { beforeEach, describe, expect, it, vi } from 'vitest'
import { COMMENTS_BY_CONTENT } from '@/mocks/fixtures/comments'
import { POLLS } from '@/mocks/fixtures/polls'
import { POSTS } from '@/mocks/fixtures/posts'
import { MOCK_ROUTES } from '@/mocks/handlers'
import type { MockRoute } from '@/mocks/types'
import { getCommentsPreview, PREVIEW_FETCH, PREVIEW_SIZE } from './comments-api'

const state = vi.hoisted(() => ({ routes: [] as readonly MockRoute[] }))

vi.mock('@/lib/api', async () => {
  const { createApiClient } = await import('@/lib/api/create-client')
  const failingFetch = () => Promise.reject(new Error('offline'))
  return {
    apiRequest: (request: Parameters<ReturnType<typeof createApiClient>>[0]) =>
      createApiClient({ baseUrl: 'http://mock', fetch: failingFetch, mocks: state.routes })(
        request,
      ),
  }
})

describe('getCommentsPreview', () => {
  beforeEach(() => {
    state.routes = MOCK_ROUTES
  })

  it('returns the first top-level comments of a post, without deleted ones or replies', async () => {
    const post = POSTS[0]!
    const result = await getCommentsPreview({ kind: 'post', id: post.id, locale: 'en' })
    if (!result.ok) throw new Error('expected ok')

    const expected = COMMENTS_BY_CONTENT[post.id]!.filter(
      (comment) => comment.parentCommentId === null && !comment.deleted,
    ).slice(0, PREVIEW_SIZE)
    expect(result.data.map((comment) => comment.id)).toEqual(expected.map((each) => each.id))
    expect(result.data.length).toBeLessThanOrEqual(PREVIEW_SIZE)
    expect(result.data[0]!.author.handle).toMatch(/^@/)
  })

  it.each(['post', 'poll'] as const)(
    'asks the %s for the top level only, with room for deleted ones (BC-04)',
    async (kind) => {
      const queries: Record<string, string>[] = []
      state.routes = MOCK_ROUTES.map((route) =>
        route.path.endsWith('/comments')
          ? {
              ...route,
              handler: (context) => (queries.push(context.query), route.handler(context)),
            }
          : route,
      )
      const id = kind === 'post' ? POSTS[0]!.id : POLLS[0]!.id
      await getCommentsPreview({ kind, id, locale: 'en' })
      expect(queries).toEqual([{ limit: String(PREVIEW_FETCH), replies: 'false' }])
    },
  )

  it('still filters replies and deleted ones when the backend ignores the parameters', async () => {
    const post = POSTS[0]!
    state.routes = MOCK_ROUTES.map((route) =>
      route.path === '/api/v1/posts/:id/comments'
        ? {
            ...route,
            handler: () => ({ status: 200, body: { items: COMMENTS_BY_CONTENT[post.id] } }),
          }
        : route,
    )
    const result = await getCommentsPreview({ kind: 'post', id: post.id, locale: 'en' })
    if (!result.ok) throw new Error('expected ok')
    const roots = COMMENTS_BY_CONTENT[post.id]!.filter((comment) => !comment.deleted)
    expect(result.data.map((comment) => comment.id)).toEqual(roots.map((each) => each.id))
  })

  it('reads the comments of a poll', async () => {
    const result = await getCommentsPreview({ kind: 'poll', id: POLLS[0]!.id, locale: 'en' })
    expect(result.ok).toBe(true)
  })

  it('passes the failure through for a missing post', async () => {
    const result = await getCommentsPreview({
      kind: 'post',
      id: '00000000-0000-4000-8000-00000000ffff',
      locale: 'en',
    })
    expect(result).toMatchObject({ ok: false, code: 'NOT_FOUND' })
  })
})
