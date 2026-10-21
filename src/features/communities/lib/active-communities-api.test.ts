import { describe, expect, it, vi } from 'vitest'
import { MOCK_ROUTES } from '@/mocks/handlers'
import { PROFILES } from '@/mocks/fixtures/users'
import { getActiveCommunities, toActiveCommunity } from './active-communities-api'

// The real client against the mock routes (P-027); a route left out reaches a fetch that fails.
const state = vi.hoisted(() => ({ offline: false }))
vi.mock('@/lib/api', async () => {
  const { createApiClient } = await import('@/lib/api/create-client')
  const { keepValidItems: keepValid } = await import('@/lib/api/helpers')
  return {
    keepValidItems: (items: unknown[], schema: never) => keepValid(items, schema, () => {}),
    apiRequest: (request: Parameters<ReturnType<typeof createApiClient>>[0]) =>
      createApiClient({
        baseUrl: 'http://mock',
        fetch: () => Promise.reject(new Error('offline')),
        mocks: state.offline ? [] : MOCK_ROUTES,
      })(request),
  }
})

const maria = PROFILES.find((profile) => profile.username === 'maria')!.id

describe('getActiveCommunities (P-027, specs/profile-aside PA-05)', () => {
  it('maps where the person publishes, the most posts first', async () => {
    const list = await getActiveCommunities(maria)
    expect(list.length).toBeGreaterThan(0)
    expect(list[0]).toMatchObject({
      handle: expect.stringMatching(/^[$#@]/),
      path: expect.stringMatching(/^\/(hub|asset|user)\//),
      postCount: expect.any(Number),
    })
  })

  it('gives nothing for a bad id or when it cannot be asked', async () => {
    expect(await getActiveCommunities('not-an-id')).toEqual([])
    state.offline = true
    expect(await getActiveCommunities(PROFILES[2]!.id)).toEqual([])
    state.offline = false
  })

  it('names an asset with $ and a personal channel with @', () => {
    const summary = { id: 'x', avatarUrl: null, viewerMembership: null, name: 'x' }
    expect(
      toActiveCommunity({
        community: { ...summary, slug: 'ggal', type: 'SYSTEM_ASSET' },
        postCount: 2,
      }),
    ).toMatchObject({ handle: '$GGAL', path: '/asset/GGAL', kind: 'asset' })
    expect(
      toActiveCommunity({
        community: { ...summary, slug: 'maria', type: 'PERSONAL_CHANNEL' },
        postCount: 1,
      }),
    ).toMatchObject({ handle: '@maria', path: '/user/maria', kind: 'user' })
  })
})
