import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MOCK_ROUTES } from '@/mocks/handlers'
import { POSTS } from '@/mocks/fixtures/posts'
import type { MockRoute } from '@/mocks/types'
import { getPost } from './post-api'

// The real client against the mock routes; a route left out reaches a fetch that always fails.
const state = vi.hoisted(() => ({
  routes: [] as readonly MockRoute[],
  calls: 0,
  viewer: { id: 'viewer', username: 'demo' } as { id: string; username: string } | null,
}))
vi.mock('@/lib/session', () => ({ getViewer: async () => state.viewer }))
vi.mock('@/lib/api', async () => {
  const { createApiClient } = await import('@/lib/api/create-client')
  const { paginatedSchema } = await import('@/lib/api/schemas')
  const { invalidInput } = await import('@/lib/api/errors')
  return {
    paginatedSchema,
    invalidInput,
    apiRequest: (request: Parameters<ReturnType<typeof createApiClient>>[0]) => {
      state.calls++
      return createApiClient({
        baseUrl: 'http://mock',
        fetch: () => Promise.reject(new Error('offline')),
        mocks: state.routes,
      })(request)
    },
  }
})

const withMention = POSTS.find(
  (post) => !post.deleted && (post.entities ?? []).some((entity) => entity.type === 'TICKER'),
)!

describe('getPost (specs/post-create-detail § 4)', () => {
  beforeEach(() => {
    state.routes = MOCK_ROUTES
    state.calls = 0
    state.viewer = { id: 'viewer', username: 'demo' }
  })

  it('maps the post, with its $ mentions linked', async () => {
    const result = await getPost(withMention.id)
    expect(result).toMatchObject({ ok: true, data: { kind: 'post', id: withMention.id } })
    expect(result.ok && result.data.body).toContain('asinko:asset/')
  })

  it('leaves mentions as plain text if the communities fail', async () => {
    state.routes = MOCK_ROUTES.filter((route) => route.path !== '/api/v1/communities')
    const result = await getPost(withMention.id)
    expect(result.ok && result.data.body).not.toContain('asinko:asset/')
  })

  it('has no membership without a session', async () => {
    state.viewer = null
    const result = await getPost(withMention.id)
    expect(result.ok && result.data.community?.viewerIsMember).toBeNull()
  })

  it('answers INVALID for an id that is not a uuid, without a request', async () => {
    expect(await getPost('../feed')).toMatchObject({ ok: false, code: 'INVALID' })
    expect(state.calls).toBe(0)
  })

  it('answers NOT_FOUND for a post that does not exist', async () => {
    expect(await getPost('00000000-0000-4000-8000-000000000000')).toMatchObject({
      ok: false,
      code: 'NOT_FOUND',
    })
  })
})
