import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEMO_USER } from '@/mocks/demo-user'
import { COMMUNITIES } from '@/mocks/fixtures/communities'
import { MOCK_ROUTES } from '@/mocks/handlers'
import type { MockRoute } from '@/mocks/types'
import { createPostAs, listCommunityOptions } from './composer-api'

// The real client against the mock routes; a route left out reaches a fetch that always fails.
const state = vi.hoisted(() => ({ routes: [] as readonly MockRoute[] }))
vi.mock('@/lib/api', async () => {
  const { createApiClient } = await import('@/lib/api/create-client')
  const { paginatedSchema } = await import('@/lib/api/schemas')
  return {
    paginatedSchema,
    apiRequest: (request: Parameters<ReturnType<typeof createApiClient>>[0]) =>
      createApiClient({
        baseUrl: 'http://mock',
        fetch: () => Promise.reject(new Error('offline')),
        mocks: state.routes,
      })(request),
  }
})

const defi = COMMUNITIES.find((each) => each.slug === 'defi')!

describe('listCommunityOptions (specs/post-create-detail PC-06)', () => {
  beforeEach(() => {
    state.routes = MOCK_ROUTES
  })

  it("puts the viewer's own channel first, then their communities", async () => {
    const result = await listCommunityOptions(DEMO_USER.username, '')
    if (!result.ok) throw new Error('expected ok')
    expect(result.data[0]).toMatchObject({ handle: `@${DEMO_USER.username}`, own: true })
    expect(result.data.slice(1).every((each) => !each.own)).toBe(true)
    expect(result.data.map((each) => each.handle)).toContain('#defi')
    expect(result.data.map((each) => each.handle)).toContain('$BTC')
  })

  it("searches every community, never other people's channels", async () => {
    const result = await listCommunityOptions(DEMO_USER.username, 'defi')
    if (!result.ok) throw new Error('expected ok')
    expect(result.data.map((each) => each.handle)).toContain('#defi')
    expect(result.data.some((each) => each.handle.startsWith('@'))).toBe(false)
  })

  it('finds the own channel too when the search matches it', async () => {
    const result = await listCommunityOptions(DEMO_USER.username, DEMO_USER.username.slice(0, 3))
    expect(result.ok && result.data[0]).toMatchObject({ own: true })
  })

  it('keeps going without the own channel, and fails if the list fails', async () => {
    state.routes = MOCK_ROUTES.filter((route) => route.path !== '/api/v1/communities/:slug')
    const result = await listCommunityOptions(DEMO_USER.username, '')
    expect(result.ok && result.data.some((each) => each.own)).toBe(false)
    state.routes = []
    expect(await listCommunityOptions(DEMO_USER.username, '')).toMatchObject({ ok: false })
  })
})

describe('createPostAs (PC-10)', () => {
  beforeEach(() => {
    state.routes = MOCK_ROUTES
  })

  it("publishes and answers the new post's id and title", async () => {
    const result = await createPostAs(DEMO_USER.id, {
      communityId: defi.id,
      type: 'LINK',
      title: 'A link',
      body: 'Worth a read',
      url: 'https://example.com',
    })
    expect(result).toMatchObject({ ok: true, data: { id: expect.any(String), title: 'A link' } })
  })

  it('passes the backend failure through, with its code', async () => {
    expect(
      await createPostAs('someone-else', {
        communityId: defi.id,
        type: 'TEXT',
        title: 'A',
        body: 'B',
      }),
    ).toMatchObject({ ok: false, code: 'USER_MISMATCH' })
  })
})
