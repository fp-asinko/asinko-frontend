import { describe, expect, it } from 'vitest'
import { DEMO_USER } from './demo-user'
import { COMMENTS_BY_CONTENT } from './fixtures/comments'
import { COMMUNITIES, PERSONAL_CHANNELS } from './fixtures/communities'
import { POSTS } from './fixtures/posts'
import { PROFILES } from './fixtures/users'
import { MOCK_ROUTES } from './handlers'
import type { MockContext } from './types'

type Page = {
  items: Array<{ kind?: string; content?: { communityId: string } }>
  nextCursor: string | null
}

function call(method: string, path: string, context: Partial<MockContext> = {}) {
  // As the client: the first route that matches, `when` included.
  const query = context.query ?? {}
  const route = MOCK_ROUTES.find(
    (each) =>
      each.method === method &&
      each.path === path &&
      (!each.when || each.when(query, context.body)),
  )
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

  it('searches communities without minding case, an asset slug too', async () => {
    const page = (
      await call('GET', '/api/v1/communities', { query: { search: 'btc', type: 'SYSTEM_ASSET' } })
    ).body as { items: Array<{ slug: string }> }
    expect(page.items.map((each) => each.slug)).toContain('BTC')
  })

  it('lists only the viewer communities with mine=true', async () => {
    const page = (await call('GET', '/api/v1/communities', { query: { mine: 'true' } })).body as {
      items: Array<{ viewerMembership: string | null }>
    }
    expect(page.items.length).toBeGreaterThan(0)
    expect(page.items.every((each) => each.viewerMembership !== null)).toBe(true)
  })

  it('marks as missing only what the backend does not have: the proposals', () => {
    const missing = MOCK_ROUTES.filter((route) => !route.implemented).map((route) => route.path)
    // "Open to" (P-026) goes alone: the rest of that endpoint is the backend's. The profile's fields
    // and uploads (P-019 to P-021, P-024) and where a person publishes (P-027) are the backend's
    // since 2026-10-20 (specs/backend-answer-1020).
    expect(missing.toSorted()).toEqual(
      [
        '/api/v1/users/:userId',
        // P-028 and P-029 (specs/community-widgets): a group's widgets and their images.
        '/api/v1/communities/:slug/widgets',
        '/api/v1/communities/:slug/widgets',
        '/api/v1/uploads/community-image',
        // P-030 (specs/profile-achievements): a person's trophy case.
        '/api/v1/users/:userId/achievements',
      ].toSorted(),
    )
  })

  describe("a person's activity (P-012, specs/backend-adoption)", () => {
    const maria = PROFILES.find((each) => each.username === 'maria')!
    type Page = { items: Array<Record<string, unknown>>; nextCursor: string | null }
    const body = async (path: Parameters<typeof call>[1], query = {}) =>
      (await call('GET', path, { params: { userId: maria.id }, query })).body as Page

    it('lists only what the person published, newest first, by kind', async () => {
      const page = await body('/api/v1/users/:userId/content', { kind: 'POST' })
      const items = page.items as Array<{
        kind: string
        content: { creator: { id: string }; publishedAt: string }
      }>
      expect(items.length).toBeGreaterThan(0)
      expect(
        items.every((item) => item.kind === 'POST' && item.content.creator.id === maria.id),
      ).toBe(true)
      const dates = items.map((item) => item.content.publishedAt)
      expect(dates).toEqual([...dates].sort().reverse())
    })

    it("lists the person's comments, replies included, each with where it is", async () => {
      const page = await body('/api/v1/users/:userId/comments')
      const items = page.items as Array<{
        author: { id: string }
        content: { kind: string; title: string }
        replies?: unknown
      }>
      expect(items.length).toBeGreaterThan(0)
      expect(items.every((item) => item.author.id === maria.id)).toBe(true)
      expect(items[0]!.content.title.length).toBeGreaterThan(0)
      expect(items[0]).not.toHaveProperty('replies')
    })

    it('answers 404 for a person that does not exist', async () => {
      const missing = { params: { userId: '00000000-0000-4000-8000-000000009999' } }
      expect(await call('GET', '/api/v1/users/:userId/content', missing)).toMatchObject({
        status: 404,
      })
      expect(await call('GET', '/api/v1/users/:userId/comments', missing)).toMatchObject({
        status: 404,
      })
    })
  })

  describe("the profile's presentation (P-019 to P-021, specs/profile-presentation)", () => {
    const me = { userId: DEMO_USER.id }
    const patch = (body: Record<string, unknown>) =>
      call('PATCH', '/api/v1/users/:userId', { params: me, body })
    const code = async (body: Record<string, unknown>) =>
      ((await patch(body)).body as { error?: { code: string } }).error?.code

    it('mocks a PATCH only when it brings "open to" (P-026, specs/backend-answer-1020 BA-01)', () => {
      const proposal = MOCK_ROUTES.find((route) => route.kind === 'proposal' && route.when)!
      expect(proposal.when!({}, { openTo: [] })).toBe(true)
      expect(proposal.when!({}, { headline: 'x', links: [] })).toBe(false)
      expect(proposal.when!({}, { bio: 'x'.repeat(2000), displayName: 'y' })).toBe(false)
    })

    it('saves the headline, city, links and banner, and removes them with ""', async () => {
      const saved = await patch({
        headline: 'Macro | Rates',
        city: 'La Plata',
        links: ['https://example.substack.com', 'https://x.com/demo'],
        bannerUrl: '/mocks/banner-demo.svg',
      })
      expect(saved).toMatchObject({
        status: 200,
        body: { headline: 'Macro | Rates', city: 'La Plata' },
      })
      const profile = PROFILES.find((each) => each.id === DEMO_USER.id)!
      expect(profile.bannerUrl).toBe('/mocks/banner-demo.svg')
      await patch({ headline: '', city: null, links: [], bannerUrl: null })
      expect(profile).toMatchObject({ headline: null, city: null, links: [], bannerUrl: null })
    })

    it('answers the errors P-019 proposes', async () => {
      expect(await code({ headline: 'x'.repeat(101) })).toBe('HEADLINE_TOO_LONG')
      expect(await code({ city: 'x'.repeat(61) })).toBe('CITY_TOO_LONG')
      expect(await code({ links: ['javascript:alert(1)'] })).toBe('INVALID_LINK')
      expect(await code({ links: Array(6).fill('https://a.com') })).toBe('TOO_MANY_LINKS')
      expect(await code({ displayName: 'x'.repeat(51), headline: 'ok' })).toBe(
        'DISPLAY_NAME_TOO_LONG',
      )
    })

    it('takes "open to" and an About of 2000 (P-024, P-026)', async () => {
      expect(await patch({ openTo: ['QUESTIONS', 'AMAS'], bio: 'x'.repeat(2000) })).toMatchObject({
        status: 200,
        body: { openTo: ['QUESTIONS', 'AMAS'] },
      })
      expect(await code({ bio: 'x'.repeat(2001) })).toBe('BIO_TOO_LONG')
      expect(await code({ openTo: ['TRADING'] })).toBe('INVALID_OPEN_TO')
      expect(await code({ openTo: ['AMAS', 'AMAS'] })).toBe('INVALID_OPEN_TO')
      await patch({ openTo: [], bio: '' })
    })

    it('signs a photo or banner upload as a post image, never an SVG', async () => {
      const body = { userId: DEMO_USER.id, contentType: 'image/webp', size: 1000 }
      expect(await call('POST', '/api/v1/uploads/avatar', { body })).toMatchObject({
        status: 200,
        body: { imageUrl: '/mocks/avatar-demo.svg' },
      })
      const svg = { ...body, contentType: 'image/svg+xml' }
      expect(await call('POST', '/api/v1/uploads/profile-banner', { body: svg })).toMatchObject({
        status: 422,
      })
    })
  })

  describe('comments sorted and searched (P-014, specs/post-detail-refresh)', () => {
    const debate = { id: POSTS[2]!.id }
    type Item = { body: string; score: number; createdAt: string; replies: Item[] }
    const list = async (query: Record<string, string>) =>
      (
        (await call('GET', '/api/v1/posts/:id/comments', { params: debate, query })).body as {
          items: Item[]
        }
      ).items

    it('orders every level by top, new or old, and keeps the backend order without sort', async () => {
      const top = await list({ sort: 'top' })
      const scores = top.map((each) => each.score)
      expect(scores).toEqual([...scores].sort((a, b) => b - a))
      const replies = top.find((each) => each.replies.length > 1)!.replies.map((r) => r.score)
      expect(replies).toEqual([...replies].sort((a, b) => b - a))

      const dates = (items: Item[]) => items.map((each) => Date.parse(each.createdAt))
      expect(dates(await list({ sort: 'new' }))).toEqual(
        dates(await list({ sort: 'new' })).sort((a, b) => b - a),
      )
      expect(dates(await list({ sort: 'old' }))).toEqual(dates(await list({})))
    })

    it('ranks a newer comment above an older, more voted one in best (decay by age)', async () => {
      const newer = 'Final take: opportunity for the patient, capitulation for the leveraged.' // 48, 1.2 h
      const older =
        'I ran the ratio against funding rates. Capitulation needs negative funding for a week. Not there yet.' // 63, 2.35 h
      const position = (items: Item[], body: string) =>
        items.findIndex((each) => each.body === body)
      const best = await list({ sort: 'best' })
      const top = await list({ sort: 'top' })
      expect(position(best, newer)).toBeLessThan(position(best, older))
      expect(position(top, newer)).toBeGreaterThan(position(top, older))
    })

    it('finds a text at any level, without case or accents, in a flat list', async () => {
      const found = await list({ q: 'BLÖBS' })
      expect(found.map((each) => each.body)).toEqual([
        'Rhymes, but the supply story is different now. Burn is lower since the blobs.',
        'And the L2s pay ETH for blobs, so some of it comes back. Small, though.',
      ])
      expect(found.every((each) => each.replies.length === 0)).toBe(true)
      expect(await list({ q: 'zzzz' })).toEqual([])
    })

    it('rejects a search too short or too long', async () => {
      for (const q of ['a', 'x'.repeat(101)]) {
        const { status } = await call('GET', '/api/v1/posts/:id/comments', {
          params: debate,
          query: { q },
        })
        expect(status).toBe(422)
      }
    })
  })

  it('searches public users by username, never private ones (specs/mention-autocomplete)', async () => {
    const result = (await call('GET', '/api/v1/search', { query: { q: 'MAR', type: 'user' } }))
      .body as { users: Array<{ username: string }>; communities: unknown[]; content: unknown[] }
    expect(result.users.map((each) => each.username)).toContain('maria')
    expect(result.communities).toEqual([])
    const privates = PROFILES.filter((each) => !each.isPublic).map((each) => each.username)
    for (const username of privates) {
      const found = (await call('GET', '/api/v1/search', { query: { q: username, type: 'user' } }))
        .body as { users: Array<{ username: string }> }
      expect(found.users.map((each) => each.username)).not.toContain(username)
    }
  })

  it('answers empty lists for an empty search, as the backend', async () => {
    expect((await call('GET', '/api/v1/search', { query: { q: ' ' } })).body).toEqual({
      users: [],
      communities: [],
      content: [],
    })
  })

  it('lists the asset catalog by symbol or name (specs/mention-autocomplete)', async () => {
    const page = (await call('GET', '/api/v1/assets', { query: { q: 'bitc' } })).body as {
      items: Array<{ symbol: string }>
    }
    expect(page.items.map((each) => each.symbol)).toContain('BTC')
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
