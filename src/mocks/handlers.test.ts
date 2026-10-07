import { describe, expect, it } from 'vitest'
import { DEMO_USER } from './demo-user'
import { COMMENTS_BY_CONTENT } from './fixtures/comments'
import { COMMUNITIES, PERSONAL_CHANNELS } from './fixtures/communities'
import { POSTS } from './fixtures/posts'
import { MOCK_ROUTES } from './handlers'
import type { MockContext } from './types'

type Page = {
  items: Array<{ kind?: string; content?: { communityId: string } }>
  nextCursor: string | null
}

function call(method: string, path: string, context: Partial<MockContext> = {}) {
  const route = MOCK_ROUTES.find((each) => each.method === method && each.path === path)
  if (!route) throw new Error(`No mock for ${method} ${path}`)
  return route.handler({ params: {}, query: {}, body: undefined, ...context })
}

describe('mock handlers behave like the contract', () => {
  it('paginates the explore feed with an opaque cursor, 20 per page', async () => {
    const first = (await call('GET', '/api/v1/feed/explore')).body as Page
    expect(first.items).toHaveLength(20)
    expect(first.nextCursor).toEqual(expect.any(String))

    const second = (
      await call('GET', '/api/v1/feed/explore', { query: { cursor: first.nextCursor! } })
    ).body as Page
    expect(second.items.length).toBeGreaterThan(0)
    expect(second.nextCursor).toBeNull()
  })

  it('filters the explore feed by community', async () => {
    const btc = COMMUNITIES.find((each) => each.slug === 'BTC')!
    const page = (await call('GET', '/api/v1/feed/explore', { query: { community: 'BTC' } }))
      .body as Page
    expect(page.items.length).toBeGreaterThan(0)
    for (const item of page.items) expect(item.content?.communityId).toBe(btc.id)
  })

  it('answers an empty page for an unknown community, like the backend dev branch', async () => {
    const response = await call('GET', '/api/v1/feed/explore', { query: { community: 'nope' } })
    expect(response).toEqual({ status: 200, body: { items: [], nextCursor: null } })
  })

  it('narrows both feeds by kind, ignoring unknown kinds', async () => {
    const polls = (await call('GET', '/api/v1/feed/explore', { query: { kind: 'POLL' } }))
      .body as Page
    expect(polls.items.length).toBeGreaterThan(0)
    expect(polls.items.every((item) => item.kind === 'POLL')).toBe(true)
    const following = (await call('GET', '/api/v1/feed/following', { query: { kind: 'POLL' } }))
      .body as Page
    expect(following.items.every((item) => item.kind === 'POLL')).toBe(true)
    const unknown = (await call('GET', '/api/v1/feed/explore', { query: { kind: 'NOPE' } }))
      .body as Page
    expect(unknown.items).toHaveLength(20)
  })

  it('lists only the viewer communities with mine=true', async () => {
    const page = (await call('GET', '/api/v1/communities', { query: { mine: 'true' } })).body as {
      items: Array<{ viewerMembership: string | null }>
    }
    expect(page.items.length).toBeGreaterThan(0)
    expect(page.items.every((each) => each.viewerMembership !== null)).toBe(true)
  })

  it('marks as missing only the routes the backend does not have (assets, E14)', () => {
    const missing = MOCK_ROUTES.filter((route) => !route.implemented).map((route) => route.path)
    expect(missing).toEqual(['/api/v1/assets', '/api/v1/assets/:symbol'])
  })

  it('builds the following feed from the communities the viewer belongs to', async () => {
    const memberOf = new Set(COMMUNITIES.filter((c) => c.viewerMembership).map((c) => c.id))
    const page = (await call('GET', '/api/v1/feed/following')).body as Page
    expect(page.items.length).toBeGreaterThan(0)
    for (const item of page.items) expect(memberOf.has(item.content!.communityId)).toBe(true)
  })

  it('searches communities by name or slug, never listing personal channels', async () => {
    const page = (await call('GET', '/api/v1/communities', { query: { search: 'defi' } })).body as {
      items: Array<{ slug: string }>
    }
    expect(page.items.map((each) => each.slug)).toEqual(['defi'])
  })

  it('returns a post and its comments, or 404', async () => {
    const id = POSTS[0]!.id
    expect((await call('GET', '/api/v1/posts/:id', { params: { id } })).status).toBe(200)
    expect((await call('GET', '/api/v1/posts/:id/comments', { params: { id } })).status).toBe(200)
    expect((await call('GET', '/api/v1/posts/:id', { params: { id: 'missing' } })).status).toBe(404)
  })

  it('hides private profiles (404) and finds public ones', async () => {
    const get = (identifier: string) =>
      call('GET', '/api/v1/profiles/:identifier', { params: { identifier } })
    expect((await get('maria')).status).toBe(200)
    expect((await get('capitalprudente')).status).toBe(404)
  })

  it('searches assets by symbol or name and links the asset community', async () => {
    const list = (await call('GET', '/api/v1/assets', { query: { q: 'sol' } })).body as {
      items: Array<{ symbol: string }>
    }
    expect(list.items.map((each) => each.symbol)).toEqual(['SOL'])

    const page = (await call('GET', '/api/v1/assets/:symbol', { params: { symbol: 'btc' } }))
      .body as {
      linkedCommunity: { slug: string } | null
    }
    expect(page.linkedCommunity?.slug).toBe('BTC')
  })
})

describe('mock writes (stateless, demo viewer)', () => {
  const demo = '00000000-0000-4000-8000-000000000001'

  it('lists the users the demo viewer follows', async () => {
    const page = (
      await call('GET', '/api/v1/users/:userId/following', { params: { userId: demo } })
    ).body as { items: Array<{ username: string }> }
    expect(page.items.map((each) => each.username).sort()).toEqual(['federico', 'jeppe', 'maria'])
  })

  it('votes a post adjusting for the previous vote', async () => {
    // POSTS[0] fixture: score 1284 with viewerVote 1 → voting -1 gives 1282.
    const result = await call('PUT', '/api/v1/posts/:id/vote', {
      params: { id: POSTS[0]!.id },
      body: { userId: demo, value: -1 },
    })
    expect(result).toEqual({ status: 200, body: { score: 1282, viewerVote: -1 } })
  })

  it('rejects voting on behalf of another user', async () => {
    const result = await call('PUT', '/api/v1/posts/:id/vote', {
      params: { id: POSTS[0]!.id },
      body: { userId: 'someone-else', value: 1 },
    })
    expect(result.status).toBe(403)
  })

  it('reveals hidden poll results when voting and blocks closed polls', async () => {
    const { POLLS } = await import('./fixtures/polls')
    const hidden = POLLS[1]!
    const voted = (
      await call('PUT', '/api/v1/polls/:id/vote', {
        params: { id: hidden.id },
        body: { userId: demo, optionId: hidden.options[1]!.id },
      })
    ).body as { totalVotes: number; viewerOptionId: string; options: Array<{ voteCount: number }> }
    expect(voted.viewerOptionId).toBe(hidden.options[1]!.id)
    expect(voted.options.every((option) => typeof option.voteCount === 'number')).toBe(true)
    expect(voted.totalVotes).toBe(1101)

    const closed = POLLS[2]!
    const result = await call('PUT', '/api/v1/polls/:id/vote', {
      params: { id: closed.id },
      body: { userId: demo, optionId: closed.options[0]!.id },
    })
    expect(result.status).toBe(409)
  })

  it('leaves a community with 204, only for the viewer themself (E02)', async () => {
    const path = '/api/v1/communities/:slug/members/:userId'
    const params = { slug: 'defi', userId: DEMO_USER.id }
    expect((await call('DELETE', path, { params, query: { userId: DEMO_USER.id } })).status).toBe(
      204,
    )
    expect(
      (await call('DELETE', path, { params, query: { userId: 'someone-else' } })).body,
    ).toMatchObject({ error: { code: 'USER_MISMATCH' } })
    expect(
      (
        await call('DELETE', path, {
          params: { ...params, slug: 'nope' },
          query: { userId: DEMO_USER.id },
        })
      ).status,
    ).toBe(404)
  })

  it('marks a favorite only as a member, and removes it idempotently (E02)', async () => {
    const path = '/api/v1/communities/:slug/favorite'
    const body = { userId: DEMO_USER.id }
    expect((await call('PUT', path, { params: { slug: 'defi' }, body })).body).toEqual({
      viewerIsFavorite: true,
    })
    expect((await call('PUT', path, { params: { slug: 'memecoins' }, body })).body).toMatchObject({
      error: { code: 'NOT_MEMBER' },
    })
    expect(
      (
        await call('DELETE', path, {
          params: { slug: 'memecoins' },
          query: { userId: DEMO_USER.id },
        })
      ).status,
    ).toBe(204)
  })

  it('answers a personal channel by username, outside the community lists (specs/community-pages)', async () => {
    const channel = (
      await call('GET', '/api/v1/communities/:slug', { params: { slug: 'federico' } })
    ).body as { type: string; viewerMembership: string | null; rules: string | null }
    expect(channel).toMatchObject({ type: 'PERSONAL_CHANNEL', viewerMembership: 'MEMBER' })
    expect(channel.rules).toEqual(expect.any(String))
    const list = (await call('GET', '/api/v1/communities')).body as {
      items: Array<{ type: string }>
    }
    expect(list.items.some((each) => each.type === 'PERSONAL_CHANNEL')).toBe(false)
  })

  it('sends the proposed display name (P-011), without tier nor rating', async () => {
    const profile = (
      await call('GET', '/api/v1/profiles/:identifier', { params: { identifier: 'federico' } })
    ).body
    expect(profile).toMatchObject({ displayName: 'Federico Piva' })
    expect(profile).not.toHaveProperty('tier')
    expect(profile).not.toHaveProperty('rating')
  })

  describe('creating posts and comments (specs/post-create-detail)', () => {
    const defi = COMMUNITIES.find((each) => each.slug === 'defi')!
    const valid = {
      userId: DEMO_USER.id,
      communityId: defi.id,
      type: 'TEXT',
      title: 'A title',
      body: 'A body',
    }
    const create = (body: object) => call('POST', '/api/v1/posts', { body })
    const errorCode = async (response: ReturnType<typeof create>) =>
      ((await response).body as { error?: { code: string } }).error?.code

    it('creates a post that GET /posts/:id finds afterwards', async () => {
      const response = await create(valid)
      expect(response.status).toBe(201)
      const id = (response.body as { id: string }).id
      expect((await call('GET', '/api/v1/posts/:id', { params: { id } })).status).toBe(200)
    })

    it('validates as the backend: community, personal channels, title, body and url', async () => {
      const other = PERSONAL_CHANNELS.find((each) => each.slug === 'maria')!
      const own = PERSONAL_CHANNELS.find((each) => each.slug === 'demo')!
      expect(await errorCode(create({ ...valid, communityId: 'nope' }))).toBe('INVALID_COMMUNITY')
      expect(await errorCode(create({ ...valid, communityId: other.id }))).toBe(
        'PERSONAL_CHANNEL_OWNER_ONLY',
      )
      expect((await create({ ...valid, communityId: own.id })).status).toBe(201)
      expect(await errorCode(create({ ...valid, title: 'x'.repeat(301) }))).toBe('VALIDATION_ERROR')
      expect(await errorCode(create({ ...valid, body: ' ' }))).toBe('VALIDATION_ERROR')
      expect(await errorCode(create({ ...valid, url: 'https://x.com' }))).toBe('VALIDATION_ERROR')
      expect((await create({ ...valid, type: 'LINK', url: 'https://x.com' })).status).toBe(201)
    })

    it('creates a comment or a reply, only under a comment of the same post', async () => {
      const post = POSTS[0]!
      const root = COMMENTS_BY_CONTENT[post.id]![0]!
      const comment = (body: object) =>
        call('POST', '/api/v1/posts/:id/comments', { params: { id: post.id }, body })
      expect((await comment({ userId: DEMO_USER.id, body: 'Yes' })).status).toBe(201)
      const reply = await comment({ userId: DEMO_USER.id, body: 'Yes', parentCommentId: root.id })
      expect(reply.body).toMatchObject({ parentCommentId: root.id })
      expect(
        (await comment({ userId: DEMO_USER.id, body: 'Yes', parentCommentId: 'nope' })).status,
      ).toBe(422)
    })

    it('keeps the created comments in their thread, at the end of their level', async () => {
      const post = POSTS[1]!
      const root = COMMENTS_BY_CONTENT[post.id]![0]!
      const params = { id: post.id }
      const created = await call('POST', '/api/v1/posts/:id/comments', {
        params,
        body: { userId: DEMO_USER.id, body: 'Kept', parentCommentId: root.id },
      })
      const id = (created.body as { id: string }).id
      const thread = (await call('GET', '/api/v1/posts/:id/comments', { params })).body as {
        items: Array<{ id: string; replyCount: number; replies: Array<{ id: string }> }>
      }
      const parent = thread.items.find((each) => each.id === root.id)!
      expect(parent.replies.at(-1)?.id).toBe(id)
      expect(parent.replyCount).toBe(parent.replies.length)
      // Replying to a created comment works too.
      const reply = await call('POST', '/api/v1/posts/:id/comments', {
        params,
        body: { userId: DEMO_USER.id, body: 'Deeper', parentCommentId: id },
      })
      expect(reply.status).toBe(201)
    })

    it('votes a comment and removes the vote', async () => {
      const root = COMMENTS_BY_CONTENT[POSTS[0]!.id]![0]!
      const params = { id: root.id }
      expect(
        (
          await call('PUT', '/api/v1/comments/:id/vote', {
            params,
            body: { userId: DEMO_USER.id, value: 1 },
          })
        ).body,
      ).toMatchObject({ viewerVote: 1 })
      expect(
        (
          await call('DELETE', '/api/v1/comments/:id/vote', {
            params,
            query: { userId: DEMO_USER.id },
          })
        ).status,
      ).toBe(204)
    })
  })
})
