import { describe, expect, it } from 'vitest'
import {
  assetPageSchema,
  commentListSchema,
  feedItemSchema,
  profileSchema,
  userCommentSchema,
} from '@/lib/api/contract'
import { paginatedSchema } from '@/lib/api/schemas'
import { createApiClient } from '@/lib/api/create-client'
import type { EndpointPattern } from '@/lib/api/path'
import { MOCK_ROUTES } from './handlers'

// Contract drift detector (api-integration.md § Smoke tests): every implemented endpoint with a
// liveExample is called on the real dev backend and its response validated with the mock's schema.
// Set by vitest.smoke.config.mts (test infrastructure, not app code).
// The development deploy of asinko-app (Vercel). http://localhost:3001 for a local backend.
const baseUrl = process.env.API_SMOKE_BASE_URL ?? 'https://asinko-app-web.vercel.app'
const failures: unknown[] = []
// Same reason as the test timeout: the dev database is far from the local backend.
const api = createApiClient({
  baseUrl,
  timeoutMs: 60_000,
  onUnexpected: (failure) => failures.push(failure),
})

const live = MOCK_ROUTES.filter((route) => route.kind === 'contract' && route.liveExample)

describe(`contract smoke against ${baseUrl}`, () => {
  it.each(live.map((route) => [`${route.method} ${route.path}`, route] as const))(
    '%s matches its contract schema',
    async (_name, route) => {
      const result = await api({
        method: route.method,
        path: route.path as EndpointPattern,
        params: route.liveExample?.params ?? {},
        query: route.liveExample?.query,
        body: route.liveExample?.body,
        schema: route.schema,
        // Routes come from a heterogeneous registry: their params are checked by buildPath at runtime.
      } as unknown as Parameters<typeof api>[0])

      expect(result, JSON.stringify(failures.at(-1) ?? result)).toMatchObject({ ok: true })
    },
  )

  // P-007 needs a real id: the first post of the feed, asked as the card preview does.
  it('GET /api/v1/posts/:id/comments?limit&replies=false answers only the top level', async () => {
    const feed = await api({
      method: 'GET',
      path: '/api/v1/feed/explore',
      query: { kind: 'POST' },
      schema: paginatedSchema(feedItemSchema),
    })
    if (!feed.ok) throw new Error(JSON.stringify(feed))
    const post = feed.data.items[0]
    if (!post) return

    const comments = await api({
      method: 'GET',
      path: '/api/v1/posts/:id/comments',
      params: { id: post.content.id },
      query: { limit: '2', replies: 'false' },
      schema: commentListSchema,
    })
    if (!comments.ok) throw new Error(JSON.stringify(comments))
    expect(comments.data.items.length).toBeLessThanOrEqual(2)
    for (const comment of comments.data.items) {
      expect(comment.parentCommentId).toBeNull()
      expect(comment.replies).toEqual([])
    }
  })

  // P-012 (adopted 2026-10-18): what a person published and commented, asked by their id.
  it('GET /api/v1/users/:userId/content and /comments answer what a person did', async () => {
    const profile = await api({
      method: 'GET',
      path: '/api/v1/profiles/:identifier',
      params: { identifier: 'maria' },
      schema: profileSchema,
    })
    if (!profile.ok) throw new Error(JSON.stringify(profile))
    const content = await api({
      method: 'GET',
      path: '/api/v1/users/:userId/content',
      params: { userId: profile.data.id },
      query: { kind: 'POST,POLL' },
      schema: paginatedSchema(feedItemSchema),
    })
    expect(content, JSON.stringify(failures.at(-1) ?? content)).toMatchObject({ ok: true })
    const comments = await api({
      method: 'GET',
      path: '/api/v1/users/:userId/comments',
      params: { userId: profile.data.id },
      schema: paginatedSchema(userCommentSchema),
    })
    expect(comments, JSON.stringify(failures.at(-1) ?? comments)).toMatchObject({ ok: true })
  })

  // P-003 (adopted 2026-10-18): an asset's page with its price, stale or not.
  it('GET /api/v1/assets/:symbol answers the price', async () => {
    const asset = await api({
      method: 'GET',
      path: '/api/v1/assets/:symbol',
      params: { symbol: 'BTC' },
      schema: assetPageSchema,
    })
    expect(asset, JSON.stringify(failures.at(-1) ?? asset)).toMatchObject({ ok: true })
  })

  // P-014 (adopted 2026-10-18): the comments' order and search, on the first post of the feed.
  it('GET /api/v1/posts/:id/comments takes sort=best and q', async () => {
    const feed = await api({
      method: 'GET',
      path: '/api/v1/feed/explore',
      query: { kind: 'POST' },
      schema: paginatedSchema(feedItemSchema),
    })
    if (!feed.ok) throw new Error(JSON.stringify(feed))
    const post = feed.data.items[0]
    if (!post) return
    const queries: Record<string, string>[] = [{ sort: 'best' }, { sort: 'new' }, { q: 'el' }]
    for (const query of queries) {
      const comments = await api({
        method: 'GET',
        path: '/api/v1/posts/:id/comments',
        params: { id: post.content.id },
        query,
        schema: commentListSchema,
      })
      expect(comments, `${JSON.stringify(query)}: ${JSON.stringify(comments)}`).toMatchObject({
        ok: true,
      })
    }
    // A search of 2 to 100 characters (backend answer of 2026-10-13); the front never sends 1.
    const short = await api({
      method: 'GET',
      path: '/api/v1/posts/:id/comments',
      params: { id: post.content.id },
      query: { q: 'a' },
      schema: commentListSchema,
    })
    expect(short).toMatchObject({ ok: false, status: 422 })
  })
})
