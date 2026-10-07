import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MOCK_ROUTES } from '@/mocks/handlers'
import { PROFILES } from '@/mocks/fixtures/users'
import { getProfileDetails, toProfileDetails } from './profile-api'

const state = vi.hoisted(() => ({ viewer: null as { id: string; username: string } | null }))
vi.mock('@/lib/session', () => ({ getViewer: async () => state.viewer }))
vi.mock('@/lib/api', async () => {
  const { createApiClient } = await import('@/lib/api/create-client')
  const { invalidInput } = await import('@/lib/api/errors')
  return {
    invalidInput,
    apiRequest: (request: Parameters<ReturnType<typeof createApiClient>>[0]) =>
      createApiClient({
        baseUrl: 'http://mock',
        fetch: () => Promise.reject(new Error('offline')),
        mocks: MOCK_ROUTES,
      })(request),
  }
})

const federico = PROFILES.find((each) => each.username === 'federico')!

describe('profile details (specs/community-pages § 12)', () => {
  beforeEach(() => {
    state.viewer = null
  })

  it('maps the proposed fields (P-011) and the badge', () => {
    expect(toProfileDetails(federico, null)).toMatchObject({
      displayName: 'Federico Piva',
      tier: 'creator',
      rating: 'AAA',
      isSelf: false,
    })
    expect(toProfileDetails({ ...federico, badgeStatus: 'INSTITUTIONAL' }, null).badge).toBe(
      'institutional',
    )
  })

  it('works without the proposed fields, as the backend today', () => {
    const { displayName, tier, rating, ...today } = federico
    void displayName
    void tier
    void rating
    expect(toProfileDetails(today, null)).toMatchObject({
      displayName: null,
      tier: null,
      rating: null,
    })
  })

  it('knows when the viewer is this user', () => {
    expect(toProfileDetails(federico, 'federico').isSelf).toBe(true)
  })

  it('drops images from hosts next/image does not allow and an empty bio', () => {
    expect(
      toProfileDetails({ ...federico, avatarUrl: 'https://evil.example/a.png', bio: ' ' }, null),
    ).toMatchObject({ avatarUrl: null, bio: null })
  })

  it('asks the profile, passing NOT_FOUND through and rejecting a bad username', async () => {
    state.viewer = { id: 'x', username: 'federico' }
    expect(await getProfileDetails('federico')).toMatchObject({ ok: true, data: { isSelf: true } })
    expect(await getProfileDetails('nobody')).toMatchObject({ ok: false, code: 'NOT_FOUND' })
    expect(await getProfileDetails('../x')).toMatchObject({ ok: false, code: 'INVALID' })
  })
})
