import {
  assetPageSchema,
  assetSchema,
  commentListSchema,
  communitySchema,
  favoriteResponseSchema,
  feedItemSchema,
  joinResponseSchema,
  pollSchema,
  postSchema,
  profileSchema,
  userSummarySchema,
  voteResultSchema,
  type RawFeedItem,
} from '@/lib/api/contract'
import { noContentSchema, paginatedSchema } from '@/lib/api/schemas'
import { DEMO_USER } from './demo-user'
import { ASSETS, assetBySymbol } from './fixtures/assets'
import { COMMENTS_BY_CONTENT } from './fixtures/comments'
import { COMMUNITIES, communityBySlug } from './fixtures/communities'
import { POLLS, pollById } from './fixtures/polls'
import { POSTS, postById } from './fixtures/posts'
import { PROFILES } from './fixtures/users'
import { commentTree } from './comment-tree'
import { paginate } from './paginate'
import type { MockContext, MockRoute } from './types'
import { addFavorite, joinCommunity, leaveCommunity, removeFavorite } from './memberships'
import { removePostVote, votePoll, votePost } from './votes'

const notFound = { status: 404, body: { error: { code: 'NOT_FOUND', message: 'mock' } } }

const noRequest: MockContext = { params: {}, query: {}, body: undefined }

/** Newest first, posts and polls mixed (E04). Deleted posts stay: the UI shows them as deleted. */
const FEED: RawFeedItem[] = [
  ...POSTS.map((content) => ({ kind: 'POST' as const, content })),
  ...POLLS.map((content) => ({ kind: 'POLL' as const, content })),
].sort((a, b) => b.content.publishedAt.localeCompare(a.content.publishedAt))

const FEED_KINDS = ['POST', 'THESIS', 'POLL']

/** ?kind=POST or ?kind=POST,POLL narrows the feed; unknown values are ignored (backend dev). */
function byKind(items: RawFeedItem[], raw: string | undefined) {
  const kinds = (raw ?? '')
    .split(',')
    .map((each) => each.trim().toUpperCase())
    .filter((each) => FEED_KINDS.includes(each))
  return kinds.length ? items.filter((item) => kinds.includes(item.kind)) : items
}

/** Communities the demo viewer belongs to (drives the Following feed). */
const MEMBER_OF = new Set(COMMUNITIES.filter((c) => c.viewerMembership).map((c) => c.id))

// Registry of mocked endpoints (api-integration.md § Mocks). Handlers follow what the backend does
// on its dev branch (asinko-app 0cdf243), not only the written contract. API_MOCKS=missing mocks only
// the routes with implemented: false.
export const MOCK_ROUTES: readonly MockRoute[] = [
  // E01: implemented in the backend; mocked for development without it.
  {
    method: 'GET',
    path: '/api/v1/profiles/:identifier',
    kind: 'contract',
    implemented: true,
    schema: profileSchema,
    example: { ...noRequest, params: { identifier: 'maria' } },
    // Seed user of the dev database (asinko-app packages/db/scripts/seed.mjs).
    liveExample: { ...noRequest, params: { identifier: 'maria' } },
    handler: ({ params }) => {
      const profile = PROFILES.find(
        (each) => each.id === params.identifier || each.username === params.identifier,
      )
      // A private profile is a 404 for anyone but its owner (E01).
      return profile && (profile.isPublic || profile.username === 'demo')
        ? { status: 200, body: profile }
        : notFound
    },
  },

  {
    method: 'GET',
    path: '/api/v1/users/:userId/following',
    kind: 'contract',
    implemented: true,
    schema: paginatedSchema(userSummarySchema),
    example: { ...noRequest, params: { userId: DEMO_USER.id } },
    handler: ({ params, query }) => {
      if (!PROFILES.some((each) => each.id === params.userId)) return notFound
      // Only the demo viewer's follows are modeled (isFollowedByViewer).
      const followed =
        params.userId === DEMO_USER.id ? PROFILES.filter((p) => p.isFollowedByViewer) : []
      const items = followed.map(({ id, username, avatarUrl, accuracyRate }) => ({
        id,
        username,
        avatarUrl,
        accuracyRate,
      }))
      return { status: 200, body: paginate(items, query.cursor) }
    },
  },

  // E02
  {
    method: 'GET',
    path: '/api/v1/communities',
    kind: 'contract',
    implemented: true,
    schema: paginatedSchema(communitySchema),
    example: { ...noRequest, query: { search: 'de' } },
    handler: ({ query }) => {
      const search = query.search?.toLowerCase()
      // ?mine=true: only the viewer's communities (requires a session; with mocks, the demo user).
      const mine = query.mine === 'true'
      const filtered = COMMUNITIES.filter(
        (each) =>
          each.type !== 'PERSONAL_CHANNEL' &&
          (!mine || each.viewerMembership !== null) &&
          (!query.type || each.type === query.type) &&
          (!search || each.name.toLowerCase().includes(search) || each.slug.includes(search)),
      ).sort((a, b) => b.memberCount - a.memberCount)
      return { status: 200, body: paginate(filtered, query.cursor) }
    },
  },
  {
    method: 'GET',
    path: '/api/v1/communities/:slug',
    kind: 'contract',
    implemented: true,
    schema: communitySchema,
    example: { ...noRequest, params: { slug: 'BTC' } },
    handler: ({ params }) => {
      const community = params.slug ? communityBySlug(params.slug) : undefined
      return community ? { status: 200, body: community } : notFound
    },
  },

  // E04
  {
    method: 'GET',
    path: '/api/v1/feed/explore',
    kind: 'contract',
    implemented: true,
    schema: paginatedSchema(feedItemSchema),
    example: noRequest,
    // The feed the Home asks for: checks Post and Poll (community, commentCount) on the real API.
    liveExample: { ...noRequest, query: { kind: 'POST,POLL' } },
    handler: ({ query }) => {
      // Backend dev: an unknown community answers an empty page, not a 404.
      if (query.community && !communityBySlug(query.community)) {
        return { status: 200, body: { items: [], nextCursor: null } }
      }
      const community = query.community ? communityBySlug(query.community) : undefined
      const items = community
        ? FEED.filter((item) => item.content.communityId === community.id)
        : FEED
      return { status: 200, body: paginate(byKind(items, query.kind), query.cursor) }
    },
  },
  {
    method: 'GET',
    path: '/api/v1/feed/following',
    kind: 'contract',
    implemented: true,
    schema: paginatedSchema(feedItemSchema),
    example: noRequest,
    // With mocks the viewer is always the demo user (src/lib/session.ts).
    handler: ({ query }) => {
      const items = FEED.filter((item) => MEMBER_OF.has(item.content.communityId))
      return { status: 200, body: paginate(byKind(items, query.kind), query.cursor) }
    },
  },

  // E03 (entities on reads: proposal P-001)
  {
    method: 'GET',
    path: '/api/v1/posts/:id',
    kind: 'contract',
    implemented: true,
    schema: postSchema,
    example: { ...noRequest, params: { id: POSTS[0]!.id } },
    handler: ({ params }) => {
      const post = params.id ? postById(params.id) : undefined
      return post ? { status: 200, body: post } : notFound
    },
  },
  {
    method: 'GET',
    path: '/api/v1/polls/:id',
    kind: 'contract',
    implemented: true,
    schema: pollSchema,
    example: { ...noRequest, params: { id: POLLS[0]!.id } },
    handler: ({ params }) => {
      const poll = params.id ? pollById(params.id) : undefined
      return poll ? { status: 200, body: poll } : notFound
    },
  },

  // E05: votes (stateless, see votes.ts)
  {
    method: 'PUT',
    path: '/api/v1/posts/:id/vote',
    kind: 'contract',
    implemented: true,
    schema: voteResultSchema,
    example: {
      ...noRequest,
      params: { id: POSTS[1]!.id },
      body: { userId: DEMO_USER.id, value: 1 },
    },
    handler: ({ params, body }) => votePost(params.id ?? '', body),
  },
  {
    method: 'DELETE',
    path: '/api/v1/posts/:id/vote',
    kind: 'contract',
    implemented: true,
    schema: noContentSchema,
    example: { ...noRequest, params: { id: POSTS[0]!.id }, query: { userId: DEMO_USER.id } },
    handler: ({ params, query }) => removePostVote(params.id ?? '', query.userId),
  },
  {
    method: 'PUT',
    path: '/api/v1/polls/:id/vote',
    kind: 'contract',
    implemented: true,
    schema: pollSchema,
    example: {
      ...noRequest,
      params: { id: POLLS[1]!.id },
      body: { userId: DEMO_USER.id, optionId: POLLS[1]!.options[1]!.id },
    },
    handler: ({ params, body }) => votePoll(params.id ?? '', body),
  },
  {
    method: 'PUT',
    path: '/api/v1/communities/:slug/members/:userId',
    kind: 'contract',
    implemented: true,
    schema: joinResponseSchema,
    example: {
      ...noRequest,
      params: { slug: 'defi', userId: DEMO_USER.id },
      body: { userId: DEMO_USER.id },
    },
    handler: ({ params, body }) => joinCommunity(params.slug ?? '', params.userId ?? '', body),
  },
  {
    method: 'DELETE',
    path: '/api/v1/communities/:slug/members/:userId',
    kind: 'contract',
    implemented: true,
    schema: noContentSchema,
    example: {
      ...noRequest,
      params: { slug: 'defi', userId: DEMO_USER.id },
      query: { userId: DEMO_USER.id },
    },
    handler: ({ params, query }) =>
      leaveCommunity(params.slug ?? '', params.userId ?? '', query.userId),
  },
  {
    method: 'PUT',
    path: '/api/v1/communities/:slug/favorite',
    kind: 'contract',
    implemented: true,
    schema: favoriteResponseSchema,
    example: { ...noRequest, params: { slug: 'defi' }, body: { userId: DEMO_USER.id } },
    handler: ({ params, body }) => addFavorite(params.slug ?? '', body),
  },
  {
    method: 'DELETE',
    path: '/api/v1/communities/:slug/favorite',
    kind: 'contract',
    implemented: true,
    schema: noContentSchema,
    example: { ...noRequest, params: { slug: 'defi' }, query: { userId: DEMO_USER.id } },
    handler: ({ params, query }) => removeFavorite(params.slug ?? '', query.userId),
  },

  // E05: comments
  {
    method: 'GET',
    path: '/api/v1/posts/:id/comments',
    kind: 'contract',
    implemented: true,
    schema: commentListSchema,
    example: {
      ...noRequest,
      params: { id: POSTS[0]!.id },
      query: { limit: '3', replies: 'false' },
    },
    handler: ({ params, query }) =>
      params.id && postById(params.id)
        ? { status: 200, body: { items: commentTree(COMMENTS_BY_CONTENT[params.id] ?? [], query) } }
        : notFound,
  },
  {
    method: 'GET',
    path: '/api/v1/polls/:id/comments',
    kind: 'contract',
    implemented: true,
    schema: commentListSchema,
    example: {
      ...noRequest,
      params: { id: POLLS[0]!.id },
      query: { limit: '3', replies: 'false' },
    },
    handler: ({ params, query }) =>
      params.id && pollById(params.id)
        ? { status: 200, body: { items: commentTree(COMMENTS_BY_CONTENT[params.id] ?? [], query) } }
        : notFound,
  },

  // E14 (the catalog's response shape is not in the contract: the standard list is assumed)
  {
    method: 'GET',
    path: '/api/v1/assets',
    kind: 'contract',
    // E14 is postponed in the backend: the asset tiles stay on mocks.
    implemented: false,
    schema: paginatedSchema(assetSchema),
    example: { ...noRequest, query: { q: 'b' } },
    handler: ({ query }) => {
      const q = query.q?.toLowerCase() ?? ''
      const matches = ASSETS.filter(
        (each) => each.symbol.toLowerCase().includes(q) || each.name.toLowerCase().includes(q),
      )
      return { status: 200, body: paginate(matches, query.cursor) }
    },
  },
  {
    method: 'GET',
    path: '/api/v1/assets/:symbol',
    kind: 'contract',
    // E14 is postponed in the backend: the asset tiles stay on mocks.
    implemented: false,
    schema: assetPageSchema,
    example: { ...noRequest, params: { symbol: 'BTC' } },
    handler: ({ params }) => {
      const asset = params.symbol ? assetBySymbol(params.symbol) : undefined
      if (!asset) return notFound
      const community = COMMUNITIES.find((each) => each.assetId === asset.id)
      return {
        status: 200,
        body: {
          ...asset,
          openTheses: [],
          linkedCommunity: community
            ? { id: community.id, slug: community.slug, name: community.name }
            : null,
        },
      }
    },
  },
]
