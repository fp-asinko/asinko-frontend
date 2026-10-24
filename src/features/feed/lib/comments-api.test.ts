import { beforeEach, describe, expect, it, vi } from 'vitest'
import { COMMENTS_BY_CONTENT } from '@/mocks/fixtures/comments'
import { POLLS } from '@/mocks/fixtures/polls'
import { POSTS } from '@/mocks/fixtures/posts'
import { MOCK_ROUTES } from '@/mocks/handlers'
import type { MockRoute } from '@/mocks/types'
import { DEMO_USER } from '@/mocks/demo-user'
import {
  createCommentAs,
  getCommentTree,
  getCommentsPreview,
  searchComments,
  PREVIEW_FETCH,
  PREVIEW_SIZE,
} from './comments-api'

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

describe('getCommentTree (specs/post-create-detail PC-14)', () => {
  beforeEach(() => {
    state.routes = MOCK_ROUTES
  })

  it('returns the whole thread, nested, keeping a deleted comment only while it has replies', async () => {
    const post = POSTS[0]!
    const result = await getCommentTree(post.id)
    if (!result.ok) throw new Error('expected ok')
    expect(result.data.map((each) => each.id)).toEqual(
      COMMENTS_BY_CONTENT[post.id]!.map((each) => each.id),
    )
    const deleted = result.data.find((each) => each.deleted)!
    expect(deleted).toMatchObject({ author: null, body: '' })
    expect(deleted.replies).toHaveLength(1)
    expect(result.data[0]!.replies[0]!.replies[0]!.author?.path).toBe('/user/quantsimula')
  })

  it('drops a deleted comment without replies', async () => {
    const post = POSTS[0]!
    const [first] = COMMENTS_BY_CONTENT[post.id]!
    state.routes = MOCK_ROUTES.map((route) =>
      route.path === '/api/v1/posts/:id/comments' && route.method === 'GET'
        ? {
            ...route,
            handler: () => ({
              status: 200,
              body: { items: [{ ...first!, deleted: true, body: '', replies: [], replyCount: 0 }] },
            }),
          }
        : route,
    )
    expect(await getCommentTree(post.id)).toEqual({ ok: true, data: [] })
  })
})

describe('sorted and searched (specs/post-detail-refresh P-014)', () => {
  beforeEach(() => {
    state.routes = MOCK_ROUTES
  })
  const debate = POSTS[2]!.id

  it('asks the backend for the order: every level comes sorted', async () => {
    const result = await getCommentTree(debate, 'top')
    if (!result.ok) throw new Error('expected ok')
    const scores = result.data.map((each) => each.score)
    expect(scores).toEqual([...scores].sort((a, b) => b - a))
  })

  it('finds comments of any level in a flat list, without replies', async () => {
    const result = await searchComments(debate, 'blobs')
    if (!result.ok) throw new Error('expected ok')
    expect(result.data).toHaveLength(2)
    expect(result.data.every((each) => each.replies.length === 0)).toBe(true)
    expect(result.data[0]!.author?.handle).toBe('@quantsimula')
  })
})

describe('createCommentAs (PC-15)', () => {
  beforeEach(() => {
    state.routes = MOCK_ROUTES
  })

  it('comments as the session user and answers the new id', async () => {
    const result = await createCommentAs(DEMO_USER.id, {
      postId: POSTS[0]!.id,
      parentCommentId: null,
      body: 'Agree',
    })
    expect(result).toMatchObject({ ok: true, data: { id: expect.any(String) } })
  })

  it('takes the new comment as the backend answers it: without `replies` (bug, 2026-10-24)', async () => {
    // asinko-app dev, serializeOne: the created comment has no `replies` key (lists always do).
    const created = {
      id: '00000000-0000-4000-8000-0000000c0001',
      author: { id: DEMO_USER.id, username: 'demo', avatarUrl: null, accuracyRate: null },
      body: 'prueba',
      parentCommentId: null,
      side: null,
      score: 0,
      viewerVote: null,
      replyCount: 0,
      editedAt: null,
      deleted: false,
      createdAt: '2026-10-24T10:00:00.000Z',
    }
    state.routes = MOCK_ROUTES.map((route) =>
      route.method === 'POST' && route.path === '/api/v1/posts/:id/comments'
        ? { ...route, handler: () => ({ status: 201, body: created }) }
        : route,
    )
    const result = await createCommentAs(DEMO_USER.id, {
      postId: POSTS[0]!.id,
      parentCommentId: null,
      body: 'prueba',
    })
    expect(result).toEqual({ ok: true, data: { id: created.id } })
  })

  it('passes the backend failure through', async () => {
    expect(
      await createCommentAs('someone-else', {
        postId: POSTS[0]!.id,
        parentCommentId: null,
        body: 'Agree',
      }),
    ).toMatchObject({ ok: false, code: 'USER_MISMATCH' })
  })
})
