import { describe, expect, it, vi } from 'vitest'
import { DEMO_USER } from '@/mocks/demo-user'
import { MOCK_ROUTES } from '@/mocks/handlers'
import { PROFILES } from '@/mocks/fixtures/users'
import { getAchievements } from './achievements-api'

// The real client against the mock routes (P-030); a route left out reaches a fetch that fails.
const state = vi.hoisted(() => ({ offline: false, reported: vi.fn() }))
vi.mock('@/lib/api', async () => {
  const { createApiClient } = await import('@/lib/api/create-client')
  const { keepValidItems: keepValid } = await import('@/lib/api/helpers')
  return {
    keepValidItems: (items: unknown[], schema: never) => keepValid(items, schema, state.reported),
    apiRequest: (request: Parameters<ReturnType<typeof createApiClient>>[0]) =>
      createApiClient({
        baseUrl: 'http://mock',
        fetch: () => Promise.reject(new Error('offline')),
        mocks: state.offline ? [] : MOCK_ROUTES,
      })(request),
  }
})

const maria = PROFILES.find((profile) => profile.username === 'maria')!.id

describe('getAchievements (P-030, specs/profile-achievements AC-01, AC-07)', () => {
  it('maps each one with its group; on your own profile, the missing ones too', async () => {
    const list = (await getAchievements(DEMO_USER.id, true))!
    expect(list).toHaveLength(16)
    expect(list[0]).toMatchObject({ earnedAt: expect.any(String), group: expect.any(String) })
    expect(list.find((each) => each.code === 'PROFILE_COMPLETE')).toMatchObject({
      group: 'profile',
      earnedAt: null,
      progress: { current: 3, target: 8 },
    })
  })

  it("never shows someone else's missing ones, whatever comes", async () => {
    const list = (await getAchievements(DEMO_USER.id, false))!
    expect(list.length).toBeGreaterThan(0)
    expect(list.every((each) => each.earnedAt)).toBe(true)
    expect((await getAchievements(maria, false))!.map((each) => each.group)).toContain('tenure')
  })

  it('gives null for a bad id or when it cannot be asked', async () => {
    expect(await getAchievements('not-an-id', false)).toBeNull()
    state.offline = true
    expect(await getAchievements(PROFILES[2]!.id, false)).toBeNull()
    state.offline = false
  })
})
