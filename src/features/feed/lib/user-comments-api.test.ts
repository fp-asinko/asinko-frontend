import { describe, expect, it, vi } from 'vitest'
import { MOCK_ROUTES } from '@/mocks/handlers'
import { PROFILES } from '@/mocks/fixtures/users'
import { getUserComments, toUserReply } from './user-comments-api'

vi.mock('@/lib/api', async () => {
  const { createApiClient } = await import('@/lib/api/create-client')
  const { invalidInput } = await import('@/lib/api/errors')
  const { keepValidItems } = await import('@/lib/api/helpers')
  return {
    invalidInput,
    keepValidItems: (items: unknown[], schema: Parameters<typeof keepValidItems>[1]) =>
      keepValidItems(items, schema, () => {}),
    apiRequest: (request: Parameters<ReturnType<typeof createApiClient>>[0]) =>
      createApiClient({
        baseUrl: 'http://mock',
        fetch: () => Promise.reject(new Error('offline')),
        mocks: MOCK_ROUTES,
      })(request),
  }
})

const maria = PROFILES.find((each) => each.username === 'maria')!

const COMMENT = {
  id: '00000000-0000-4000-8000-000000006001',
  author: { id: maria.id, username: 'maria', avatarUrl: null },
  body: 'Agree.',
  parentCommentId: null,
  score: 3,
  viewerVote: null,
  replyCount: 0,
  editedAt: null,
  deleted: false,
  createdAt: '2026-10-10T10:00:00.000Z',
}

describe('user comments (specs/backend-adoption BK-03)', () => {
  it("lists a person's comments with where each one is", async () => {
    const result = await getUserComments(maria.id)
    if (!result.ok) throw new Error('expected ok')
    expect(result.data.items.length).toBeGreaterThan(0)
    expect(result.data.items[0]!.where.title.length).toBeGreaterThan(0)
  })

  it("links a post's comment to itself in its post; a poll's says where without a link", () => {
    const community = {
      id: '00000000-0000-4000-8000-000000001001',
      slug: 'defi',
      name: 'DeFi',
      type: 'USER_PUBLIC' as const,
      avatarUrl: null,
      viewerMembership: null,
    }
    const id = '00000000-0000-4000-8000-000000004001'
    expect(
      toUserReply({ ...COMMENT, content: { kind: 'POST', id, title: 'Rates are up', community } }),
    ).toMatchObject({
      where: {
        title: 'Rates are up',
        path: `/post/${id}/rates-are-up#comment-${COMMENT.id}`,
        community: { handle: '#defi', path: '/hub/defi' },
      },
    })
    expect(
      toUserReply({ ...COMMENT, content: { kind: 'POLL', id, title: 'Cut?', community: null } })
        .where,
    ).toEqual({ title: 'Cut?', path: null, community: null })
  })

  it('checks the id and the cursor before asking, and passes a 404 through', async () => {
    expect(await getUserComments('maria')).toMatchObject({ ok: false, code: 'INVALID' })
    expect(await getUserComments(maria.id, 'a b')).toMatchObject({ ok: false })
    expect(await getUserComments('00000000-0000-4000-8000-000000009999')).toMatchObject({
      ok: false,
      code: 'NOT_FOUND',
    })
  })
})
