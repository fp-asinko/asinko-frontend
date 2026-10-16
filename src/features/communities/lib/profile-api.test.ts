import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MOCK_ROUTES } from '@/mocks/handlers'
import { PROFILES } from '@/mocks/fixtures/users'
import { DEMO_USER } from '@/mocks/demo-user'
import { getProfileDetails, toProfileDetails, updateProfileAs } from './profile-api'

const state = vi.hoisted(() => ({
  viewer: null as { id: string; username: string } | null,
  bodies: [] as unknown[],
}))
vi.mock('@/lib/session', () => ({ getViewer: async () => state.viewer }))
vi.mock('@/lib/api', async () => {
  const { createApiClient } = await import('@/lib/api/create-client')
  const { invalidInput } = await import('@/lib/api/errors')
  return {
    invalidInput,
    apiRequest: (request: Parameters<ReturnType<typeof createApiClient>>[0]) => {
      if (request.method === 'PATCH') state.bodies.push(request.body)
      return createApiClient({
        baseUrl: 'http://mock',
        fetch: () => Promise.reject(new Error('offline')),
        mocks: MOCK_ROUTES,
      })(request)
    },
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

  it('maps the presentation (specs/profile-presentation P-019, P-020): links only http(s), five at most', () => {
    const details = toProfileDetails(
      {
        ...federico,
        headline: '  Macro | Rates  ',
        city: '',
        countryCode: 'AR',
        bannerUrl: '/mocks/banner-demo.svg',
        links: [
          'https://x.com/fede',
          'javascript:alert(1)',
          'https://a.com',
          'https://b.com',
          'https://c.com',
          'https://d.com',
          'https://e.com',
        ],
      },
      null,
    )
    expect(details).toMatchObject({
      headline: 'Macro | Rates',
      city: null,
      countryCode: 'AR',
      bannerUrl: '/mocks/banner-demo.svg',
    })
    expect(details.links.map((link) => link.host)).toEqual([
      'x.com',
      'a.com',
      'b.com',
      'c.com',
      'd.com',
    ])
    expect(details.links[0]).toMatchObject({ site: 'x' })
  })

  it('has no presentation when the backend does not send it, as today', () => {
    expect(toProfileDetails(federico, null)).toMatchObject({
      headline: null,
      city: null,
      links: [],
      bannerUrl: null,
    })
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

describe('updateProfileAs (specs/profile-edit PE-03, specs/profile-presentation PP-08)', () => {
  beforeEach(() => {
    state.bodies = []
    state.viewer = DEMO_USER
  })

  it("saves the viewer's profile and the page shows it; empty removes it", async () => {
    expect(await updateProfileAs(DEMO_USER.id, { bio: 'Macro and rates.' })).toEqual({
      ok: true,
      data: null,
    })
    expect(await getProfileDetails('demo')).toMatchObject({ data: { bio: 'Macro and rates.' } })
    await updateProfileAs(DEMO_USER.id, { bio: '', headline: 'Rates', links: ['https://x.com/d'] })
    expect(await getProfileDetails('demo')).toMatchObject({
      data: { bio: null, headline: 'Rates', links: [{ host: 'x.com', site: 'x' }] },
    })
    await updateProfileAs(DEMO_USER.id, { headline: '', links: [] })
  })

  it('sends the proposed fields apart, so they reach the mock while the backend lacks them', async () => {
    await updateProfileAs(DEMO_USER.id, {
      displayName: 'Demo',
      countryCode: '',
      headline: 'Rates',
      city: 'La Plata',
    })
    expect(state.bodies).toEqual([
      { displayName: 'Demo', countryCode: null },
      { headline: 'Rates', city: 'La Plata' },
    ])
    state.bodies = []
    await updateProfileAs(DEMO_USER.id, { bio: 'Hi' })
    expect(state.bodies).toEqual([{ bio: 'Hi' }])
    await updateProfileAs(DEMO_USER.id, { displayName: '', headline: '', city: '' })
  })

  it("refuses someone else's profile and a text too long, as the backend", async () => {
    expect(await updateProfileAs(federico.id, { bio: 'Hi' })).toMatchObject({
      ok: false,
      code: 'USER_MISMATCH',
    })
    expect(await updateProfileAs(DEMO_USER.id, { bio: 'x'.repeat(161) })).toMatchObject({
      ok: false,
      code: 'BIO_TOO_LONG',
    })
    expect(await updateProfileAs(DEMO_USER.id, { headline: 'x'.repeat(101) })).toMatchObject({
      ok: false,
      code: 'HEADLINE_TOO_LONG',
    })
  })
})
