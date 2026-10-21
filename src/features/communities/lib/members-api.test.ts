import { describe, expect, it, vi } from 'vitest'
import { MOCK_ROUTES } from '@/mocks/handlers'
import { getMembers, toMemberItem } from './members-api'

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

describe('getMembers (specs/community-members CM-03, CM-05, CM-09)', () => {
  it("pages #defi's members, 20 at a time, newest first, the viewer's row without a button", async () => {
    const first = await getMembers('defi', 'demo')
    if (!first.ok) throw new Error('expected a page')
    expect(first.data.items).toHaveLength(20)
    expect(first.data.nextCursor).not.toBeNull()
    // The demo viewer joined last: first in the list.
    expect(first.data.items[0]).toMatchObject({ username: 'demo', isSelf: true, followed: null })
    expect(first.data.items[1]).toMatchObject({ isSelf: false, accuracyRate: null })
    expect(typeof first.data.items[1]!.followed).toBe('boolean')

    const second = await getMembers('defi', 'demo', first.data.nextCursor!)
    if (!second.ok) throw new Error('expected a page')
    expect(second.data.items.length).toBeGreaterThan(0)
    expect(second.data.nextCursor).toBeNull()
  })

  it('is an empty list for a community that does not exist, as the backend', async () => {
    expect(await getMembers('nope', null)).toMatchObject({
      ok: true,
      data: { items: [], nextCursor: null },
    })
  })

  it('checks the slug and the cursor before the network', async () => {
    network.calls = 0
    expect((await getMembers('../x', null)).ok).toBe(false)
    expect((await getMembers('defi', null, 'bad cursor!')).ok).toBe(false)
    expect(network.calls).toBe(0)
  })

  it('maps a member to a row: their page and name, no accuracy, follow unknown without a session', () => {
    const id = '00000000-0000-4000-8000-000000000001'
    expect(toMemberItem({ id, username: 'ana', avatarUrl: null, role: 'MODERATOR' }, null)).toEqual(
      {
        username: 'ana',
        displayName: null,
        path: '/user/ana',
        avatarUrl: null,
        accuracyRate: null,
        followed: null,
        isSelf: false,
      },
    )
    expect(
      toMemberItem(
        { id, username: 'ana', displayName: ' Ana ', avatarUrl: null, role: 'MEMBER' },
        'ana',
      ),
    ).toMatchObject({ displayName: 'Ana', isSelf: true })
    // Without a session nothing is followed, whatever the response says (the mocks answer as demo).
    expect(
      toMemberItem(
        { id, username: 'ana', avatarUrl: null, role: 'MEMBER', isFollowedByViewer: true },
        null,
      ),
    ).toMatchObject({ followed: null })
  })
})
