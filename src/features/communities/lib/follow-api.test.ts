import { describe, expect, it, vi } from 'vitest'
import { DEMO_USER } from '@/mocks/demo-user'
import { MOCK_ROUTES } from '@/mocks/handlers'
import { PROFILES } from '@/mocks/fixtures/users'
import { getFollowList, toFollowItem } from './follow-api'

const network = vi.hoisted(() => ({ calls: 0 }))
vi.mock('@/lib/api', async () => {
  const { createApiClient } = await import('@/lib/api/create-client')
  const { invalidInput } = await import('@/lib/api/errors')
  const { keepValidItems: keepValid } = await import('@/lib/api/helpers')
  return {
    invalidInput,
    keepValidItems: (items: unknown[], schema: never) => keepValid(items, schema, () => {}),
    apiRequest: (request: Parameters<ReturnType<typeof createApiClient>>[0]) => {
      network.calls += 1
      return createApiClient({
        baseUrl: 'http://mock',
        fetch: () => Promise.reject(new Error('offline')),
        mocks: MOCK_ROUTES,
      })(request)
    },
  }
})

const id = (username: string) => PROFILES.find((each) => each.username === username)!.id

describe('getFollowList (specs/follow-lists FL-03, FL-09)', () => {
  it("pages @maria's followers, 20 at a time, with whether the viewer follows each (P-017)", async () => {
    const first = await getFollowList(id('maria'), 'followers', 'demo')
    if (!first.ok) throw new Error('expected a page')
    expect(first.data.items).toHaveLength(20)
    expect(first.data.nextCursor).not.toBeNull()
    const demo = first.data.items.find((each) => each.username === 'demo')
    expect(demo).toMatchObject({ isSelf: true, followed: null, path: '/user/demo' })

    const second = await getFollowList(id('maria'), 'followers', 'demo', first.data.nextCursor!)
    if (!second.ok) throw new Error('expected a page')
    expect(second.data.items.length).toBeGreaterThan(0)
    expect(second.data.nextCursor).toBeNull()
  })

  it('lists whom someone follows, marking who the viewer follows too', async () => {
    const result = await getFollowList(id('maria'), 'following', 'demo')
    if (!result.ok) throw new Error('expected a page')
    expect(result.data.items.map((each) => each.username)).toEqual([
      'federico',
      'jeppe',
      'quantsimula',
    ])
    expect(result.data.items[0]).toMatchObject({ followed: true, isSelf: false })
  })

  it('answers 404 for someone who does not exist, and checks the id and cursor first', async () => {
    expect(
      await getFollowList('00000000-0000-4000-8000-000000000999', 'followers', null),
    ).toMatchObject({ ok: false, code: 'NOT_FOUND' })
    network.calls = 0
    expect((await getFollowList('nope', 'followers', null)).ok).toBe(false)
    expect((await getFollowList(DEMO_USER.id, 'followers', null, 'bad cursor!')).ok).toBe(false)
    expect(network.calls).toBe(0)
  })
})

describe('toFollowItem', () => {
  it('leaves the follow state unknown while the backend does not send it (P-017)', () => {
    expect(
      toFollowItem({ id: DEMO_USER.id, username: 'ana', avatarUrl: null }, null),
    ).toMatchObject({ followed: null, accuracyRate: null, isSelf: false })
  })
})
