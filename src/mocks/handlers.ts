import {
  assetPageSchema,
  assetSchema,
  commentListSchema,
  communitySchema,
  feedItemSchema,
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
import { paginate } from './paginate'
import type { MockContext, MockRoute } from './types'
import { removePostVote, votePoll, votePost } from './votes'

const notFound = { status: 404, body: { error: { code: 'NOT_FOUND', message: 'mock' } } }

const noRequest: MockContext = { params: {}, query: {}, body: undefined }

/** Newest first, posts and polls mixed (E04). Deleted posts stay: the UI shows them as deleted. */
const FEED: RawFeedItem[] = [
  ...POSTS.map((content) => ({ kind: 'POST' as const, content })),
  ...POLLS.map((content) => ({ kind: 'POLL' as const, content })),
].sort((a, b) => b.content.publishedAt.localeCompare(a.content.publishedAt))

/** Communities the demo viewer belongs to (drives the Following feed). */
const MEMBER_OF = new Set(COMMUNITIES.filter((c) => c.viewerMembership).map((c) => c.id))

// Registry of mocked endpoints (api-integration.md § Mocks). Only routes listed here are mocked;
// the rest go to the real API. Remove a route here when the backend implements it.
export const MOCK_ROUTES: readonly MockRoute[] = [
  // E01: implemented in the backend; mocked for development without it.
  {
    method: 'GET',
    path: '/api/v1/profiles/:identifier',
    kind: 'contract',
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
    schema: paginatedSchema(communitySchema),
    example: { ...noRequest, query: { search: 'de' } },
    handler: ({ query }) => {
      const search = query.search?.toLowerCase()
      const filtered = COMMUNITIES.filter(
        (each) =>
          each.type !== 'PERSONAL_CHANNEL' &&
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
    schema: communitySchema,
    example: { ...noRequest, params: { slug: 'btc' } },
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
    schema: paginatedSchema(feedItemSchema),
    example: noRequest,
    handler: ({ query }) => {
      const community = query.community ? communityBySlug(query.community) : undefined
      if (query.community && !community) return notFound
      const items = community
        ? FEED.filter((item) => item.content.communityId === community.id)
        : FEED
      return { status: 200, body: paginate(items, query.cursor) }
    },
  },
  {
    method: 'GET',
    path: '/api/v1/feed/following',
    kind: 'contract',
    schema: paginatedSchema(feedItemSchema),
    example: noRequest,
    // With mocks the viewer is always the demo user (src/lib/session.ts).
    handler: ({ query }) => {
      const items = FEED.filter((item) => MEMBER_OF.has(item.content.communityId))
      return { status: 200, body: paginate(items, query.cursor) }
    },
  },

  // E03 (entities on reads: proposal P-001)
  {
    method: 'GET',
    path: '/api/v1/posts/:id',
    kind: 'contract',
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
    schema: noContentSchema,
    example: { ...noRequest, params: { id: POSTS[0]!.id }, query: { userId: DEMO_USER.id } },
    handler: ({ params, query }) => removePostVote(params.id ?? '', query.userId),
  },
  {
    method: 'PUT',
    path: '/api/v1/polls/:id/vote',
    kind: 'contract',
    schema: pollSchema,
    example: {
      ...noRequest,
      params: { id: POLLS[1]!.id },
      body: { userId: DEMO_USER.id, optionId: POLLS[1]!.options[1]!.id },
    },
    handler: ({ params, body }) => votePoll(params.id ?? '', body),
  },

  // E05: comments
  {
    method: 'GET',
    path: '/api/v1/posts/:id/comments',
    kind: 'contract',
    schema: commentListSchema,
    example: { ...noRequest, params: { id: POSTS[0]!.id } },
    handler: ({ params }) =>
      params.id && postById(params.id)
        ? { status: 200, body: { items: COMMENTS_BY_CONTENT[params.id] ?? [] } }
        : notFound,
  },
  {
    method: 'GET',
    path: '/api/v1/polls/:id/comments',
    kind: 'contract',
    schema: commentListSchema,
    example: { ...noRequest, params: { id: POLLS[0]!.id } },
    handler: ({ params }) =>
      params.id && pollById(params.id)
        ? { status: 200, body: { items: COMMENTS_BY_CONTENT[params.id] ?? [] } }
        : notFound,
  },

  // E14 (the catalog's response shape is not in the contract: the standard list is assumed)
  {
    method: 'GET',
    path: '/api/v1/assets',
    kind: 'contract',
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
