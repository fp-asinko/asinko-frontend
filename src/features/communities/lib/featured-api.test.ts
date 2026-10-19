import { describe, expect, it, vi } from 'vitest'
import { DEMO_USER } from '@/mocks/demo-user'
import { MOCK_ROUTES } from '@/mocks/handlers'
import { mockId } from '@/mocks/fixtures/ids'
import { PROFILES } from '@/mocks/fixtures/users'
import { DEMO_POST_ID } from '@/mocks/posting'
import { featureAs, getFeatured, getProfileFeatured, unfeatureAs } from './featured-api'

// The real client against the mock routes (P-025); a route left out reaches a fetch that fails.
vi.mock('@/lib/api', async () => {
  const { createApiClient } = await import('@/lib/api/create-client')
  const { invalidInput } = await import('@/lib/api/errors')
  const { keepValidItems: keepValid } = await import('@/lib/api/helpers')
  const { noContentSchema } = await import('@/lib/api/schemas')
  return {
    invalidInput,
    noContentSchema,
    keepValidItems: (items: unknown[], schema: never) => keepValid(items, schema, () => {}),
    apiRequest: (request: Parameters<ReturnType<typeof createApiClient>>[0]) =>
      createApiClient({
        baseUrl: 'http://mock',
        fetch: () => Promise.reject(new Error('offline')),
        mocks: MOCK_ROUTES,
      })(request),
  }
})

const maria = PROFILES.find((profile) => profile.username === 'maria')!.id

describe('featured-api (P-025, specs/profile-showcase PS-05, PS-07)', () => {
  it("maps someone's featured to small cards: a thesis with its state, a post with its page", async () => {
    const result = await getFeatured(maria)
    if (!result.ok) throw new Error('expected ok')
    expect(result.data).toMatchObject([
      {
        kind: 'thesis',
        id: mockId(9, 3),
        state: 'correct',
        community: { handle: expect.any(String) },
      },
      {
        kind: 'post',
        id: mockId(4, 1),
        title: 'Whales accumulated 48,000 $BTC in two weeks',
        path: expect.stringMatching(/^\/post\/.+\/whales-accumulated/),
        community: { handle: '$BTC', path: '/asset/BTC' },
      },
    ])
  })

  it('features and takes out your own post', async () => {
    const ref = { kind: 'post' as const, id: DEMO_POST_ID }
    expect(await featureAs(DEMO_USER.id, ref)).toEqual({ ok: true, data: null })
    expect(await getProfileFeatured(DEMO_USER.id)).toMatchObject([
      { kind: 'post', id: DEMO_POST_ID, community: { handle: '@demo', path: '/user/demo' } },
    ])
    expect(await unfeatureAs(DEMO_USER.id, ref)).toEqual({ ok: true, data: null })
    expect(await getProfileFeatured(DEMO_USER.id)).toEqual([])
  })

  it('says why it cannot, and gives the profile nothing when the list fails', async () => {
    expect(await featureAs(DEMO_USER.id, { kind: 'post', id: mockId(4, 1) })).toMatchObject({
      ok: false,
      code: 'NOT_OWNER',
    })
    expect(await getFeatured('not-an-id')).toMatchObject({ ok: false, code: 'INVALID' })
    expect(await getProfileFeatured('not-an-id')).toEqual([])
  })
})
