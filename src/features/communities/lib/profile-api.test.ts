import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MOCK_ROUTES } from '@/mocks/handlers'
import { PROFILES } from '@/mocks/fixtures/users'
import { DEMO_USER } from '@/mocks/demo-user'
import { getProfileDetails, toProfileDetails, updateProfileAs } from './profile-api'

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

  it('maps the proposed display name (P-011) and the badge', () => {
    expect(toProfileDetails(federico, null)).toMatchObject({
      displayName: 'Federico Piva',
      isSelf: false,
      // "Member since" in the hover card (specs/mention-preview MP-05).
      joinedAt: federico.createdAt,
    })
    expect(toProfileDetails({ ...federico, badgeStatus: 'INSTITUTIONAL' }, null).badge).toBe(
      'institutional',
    )
  })

  it('works without the display name, as the backend today', () => {
    const { displayName, ...today } = federico
    void displayName
    expect(toProfileDetails(today, null).displayName).toBeNull()
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

describe('updateProfileAs (specs/profile-edit PE-03, PE-09)', () => {
  it("saves the viewer's bio and answers it, null once removed", async () => {
    expect(await updateProfileAs(DEMO_USER.id, { bio: 'Macro and rates.' })).toEqual({
      ok: true,
      data: { bio: 'Macro and rates.' },
    })
    expect(await getProfileDetails('demo')).toMatchObject({ data: { bio: 'Macro and rates.' } })
    expect(await updateProfileAs(DEMO_USER.id, { bio: '' })).toEqual({
      ok: true,
      data: { bio: null },
    })
  })

  it("refuses someone else's profile and a bio too long, as the backend", async () => {
    expect(await updateProfileAs(federico.id, { bio: 'Hi' })).toMatchObject({
      ok: false,
      code: 'USER_MISMATCH',
    })
    expect(await updateProfileAs(DEMO_USER.id, { bio: 'x'.repeat(161) })).toMatchObject({
      ok: false,
      code: 'BIO_TOO_LONG',
    })
  })
})
