import {
  assetCatalogSchema,
  assetPageSchema,
  commentListSchema,
  createdCommentSchema,
  communityMemberSchema,
  communitySchema,
  favoriteResponseSchema,
  feedItemSchema,
  feedPageSchema,
  impressionsRequestSchema,
  joinResponseSchema,
  pollSchema,
  postImageUploadSchema,
  profileImageUploadSchema,
  userCommentSchema,
  achievementListSchema,
  activeCommunitiesSchema,
  communityImageUploadSchema,
  widgetListSchema,
  draftSchema,
  featuredListSchema,
  postSchema,
  profileSchema,
  searchResultSchema,
  thesisSchema,
  userSchema,
  userSummarySchema,
  voteResultSchema,
  type RawComment,
  type RawContentFeedItem,
  type RawFeedItem,
  type RawFeedReason,
} from '@/lib/api/contract'
import { noContentSchema, paginatedSchema } from '@/lib/api/schemas'
import { DEMO_USER } from './demo-user'
import { AD_EVERY, randomAds } from './fixtures/ads'
import { GLOSSARY_EVERY, randomGlossary } from './fixtures/glossary'
import { ASSETS, assetBySymbol } from './fixtures/assets'
import { COMMENTS_BY_CONTENT } from './fixtures/comments'
import { COMMUNITIES, communityBySlug, communitySummary } from './fixtures/communities'
import { POLLS, pollById } from './fixtures/polls'
import { POSTS } from './fixtures/posts'
import { PROFILES, summary } from './fixtures/users'
import { commentTree, searchComments } from './comment-tree'
import { withTopPost } from './top-post'
import { followersOf, followingOf, listItem } from './fixtures/follows'
import { membersOf } from './fixtures/members'
import { thesesBy } from './fixtures/theses'
import { listAchievements } from './achievements'
import { userComments, userContent, activeCommunities } from './user-activity'
import { createDraft, deleteDraft, listDrafts, SEED_DRAFT_ID, updateDraft } from './drafts'
import { addFeatured, listFeatured, removeFeatured } from './featured'
import { listWidgets, saveWidgets, signCommunityImageUpload } from './widgets'
import { isProposedUserChange, updateUser } from './profile-edit'
import { signProfileImageUpload } from './profile-image'
import { paginate } from './paginate'
import { signPostImageUpload } from './post-image'
import type { MockContext, MockExtension, MockResponse, MockRoute } from './types'
import { addFavorite, joinCommunity, leaveCommunity, removeFavorite } from './memberships'
import {
  commentsOf,
  createComment,
  createPost,
  DEMO_POST_ID,
  findPost,
  removeCommentVote,
  voteComment,
} from './posting'
import { removePostVote, votePoll, votePost } from './votes'

const notFound = { status: 404, body: { error: { code: 'NOT_FOUND', message: 'mock' } } }
const validationError = {
  status: 422,
  body: { error: { code: 'VALIDATION_ERROR', message: 'mock' } },
}

const noRequest: MockContext = { params: {}, query: {}, body: undefined }

/** Newest first, posts and polls mixed (E04). Deleted posts stay: the UI shows them as deleted. */
const FEED: RawContentFeedItem[] = [
  ...POSTS.map((content) => ({ kind: 'POST' as const, content })),
  ...POLLS.map((content) => ({ kind: 'POLL' as const, content })),
].sort((a, b) => b.content.publishedAt.localeCompare(a.content.publishedAt))

const FEED_KINDS = ['POST', 'THESIS', 'POLL']

/** ?kind=POST or ?kind=POST,POLL narrows the feed; unknown values are ignored (backend dev). */
function byKind(items: RawContentFeedItem[], raw: string | undefined) {
  const kinds = (raw ?? '')
    .split(',')
    .map((each) => each.trim().toUpperCase())
    .filter((each) => FEED_KINDS.includes(each))
  return kinds.length ? items.filter((item) => kinds.includes(item.kind)) : items
}

/** Communities the demo viewer belongs to (drives the Following feed). */
const MEMBER_OF = new Set(COMMUNITIES.filter((c) => c.viewerMembership).map((c) => c.id))

/** A page's requestId (specs/explore-v1): a stable uuid per feed and cursor, as opaque as the real one. */
function requestIdOf(feed: number, cursor: string | undefined) {
  const offset = cursor ? Number(atob(cursor)) || 0 : 0
  return `00000000-0000-4000-8000-${String(feed * 1e6 + offset).padStart(12, '0')}`
}

/** Explore's reasons, in turn (specs/explore-v1 § 4): the four types, as the backend mixes them. */
function withReason(item: RawContentFeedItem, index: number): RawContentFeedItem {
  const { id, slug, name, type, avatarUrl } = communitySummary('macro')
  const reasons: RawFeedReason[] = [
    { type: 'SIMILAR', via: { id, slug, name, type, avatarUrl }, countryCode: null },
    { type: 'COUNTRY', via: null, countryCode: 'AR' },
    { type: 'TRENDING', via: null, countryCode: null },
    { type: 'FOLLOWING', via: null, countryCode: null },
  ]
  return { ...item, reason: reasons[index % reasons.length] }
}

/** An ad of a page, whether it came from a mock or from the backend. */
const isAd = (item: unknown) =>
  typeof item === 'object' && item !== null && 'kind' in item && item.kind === 'AD'

/**
 * An ad after every 10 items of a page, where the backend would put them (P-031, specs/ads AD-01),
 * chosen at random on every request.
 */
function withFeedAds<T>(items: readonly T[]): (T | RawFeedItem)[] {
  const ads = randomAds(Math.floor(items.length / AD_EVERY))
  return items.flatMap((item, index): (T | RawFeedItem)[] =>
    (index + 1) % AD_EVERY === 0
      ? [item, { kind: 'AD' as const, content: ads[(index + 1) / AD_EVERY - 1]!, reason: null }]
      : [item],
  )
}

/**
 * A glossary term after every 8 posts of a Home page, ads not counted (P-032, specs/glossary
 * GL-01), chosen at random on every request.
 */
function withGlossary<T>(items: readonly T[]): (T | RawFeedItem)[] {
  const content = items.filter((item) => !isAd(item)).length
  const terms = randomGlossary(Math.floor(content / GLOSSARY_EVERY))
  let seen = 0
  return items.flatMap((item): (T | RawFeedItem)[] => {
    if (isAd(item)) return [item]
    seen++
    const term = seen % GLOSSARY_EVERY === 0 ? terms[seen / GLOSSARY_EVERY - 1] : undefined
    return term ? [item, { kind: 'GLOSSARY' as const, content: term, reason: null }] : [item]
  })
}

/**
 * A page of a feed, with its requestId (null for an empty one) and its ads, as the backend. The
 * Home's (Explore and Following, no community) also carries glossary terms.
 */
function feedPage(
  feed: number,
  items: RawContentFeedItem[],
  cursor: string | undefined,
  home = false,
) {
  const page = paginate(items, cursor)
  const withAds = withFeedAds(page.items)
  return {
    ...page,
    items: home ? withGlossary(withAds) : withAds,
    requestId: page.items.length ? requestIdOf(feed, cursor) : null,
  }
}

/**
 * A post's comment tree with its ads (P-031, specs/ads AD-04): one under the post and one after
 * every 10 comments in reading order, replies included. Never in a search nor a card's preview.
 */
function treeAds(tree: readonly RawComment[]) {
  const order: string[] = []
  const walk = (list: readonly RawComment[]) => {
    for (const comment of list) {
      order.push(comment.id)
      walk(comment.replies)
    }
  }
  walk(tree)
  const after = order.filter((_, index) => (index + 1) % AD_EVERY === 0)
  const [first, ...rest] = randomAds(after.length + 1)
  return [
    { afterCommentId: null, ad: first! },
    ...after.map((id, index) => ({ afterCommentId: id, ad: rest[index]! })),
  ]
}

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
    path: '/api/v1/users/:userId/followers',
    kind: 'contract',
    implemented: true,
    schema: paginatedSchema(userSummarySchema),
    example: { ...noRequest, params: { userId: PROFILES[1]!.id } },
    handler: ({ params, query }) => {
      if (!PROFILES.some((each) => each.id === params.userId)) return notFound
      const items = followersOf(params.userId ?? '').map(listItem)
      return { status: 200, body: paginate(items, query.cursor) }
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
      const items = followingOf(params.userId ?? '').map(listItem)
      return { status: 200, body: paginate(items, query.cursor) }
    },
  },

  // P-026 (proposal, specs/profile-showcase): a PATCH with "open to" goes to the mock; the rest of
  // the profile (P-019, P-020, P-024 included, backend 2026-10-20), to the backend.
  {
    method: 'PATCH',
    path: '/api/v1/users/:userId',
    kind: 'proposal',
    implemented: false,
    when: (_query, body) => isProposedUserChange(body),
    schema: userSchema,
    example: {
      ...noRequest,
      params: { userId: DEMO_USER.id },
      body: { openTo: ['AMAS', 'MENTORING'] },
    },
    handler: ({ params, body }) => updateUser(params.userId ?? '', body),
  },
  // P-012 (backend, 2026-10-13): what a person published and commented (specs/backend-adoption).
  {
    method: 'GET',
    path: '/api/v1/users/:userId/content',
    kind: 'contract',
    implemented: true,
    schema: paginatedSchema(feedItemSchema),
    example: { ...noRequest, params: { userId: PROFILES[1]!.id }, query: { kind: 'POST,POLL' } },
    handler: ({ params, query }) => {
      const response = userContent(params.userId ?? '', query)
      const body = response.body as { items?: RawFeedItem[] } | undefined
      // A profile's posts carry ads too, as every feed (specs/ads AD-01).
      return response.status === 200 && body?.items
        ? { ...response, body: { ...body, items: withFeedAds(body.items) } }
        : response
    },
  },
  {
    method: 'GET',
    path: '/api/v1/users/:userId/comments',
    kind: 'contract',
    implemented: true,
    schema: paginatedSchema(userCommentSchema),
    example: { ...noRequest, params: { userId: PROFILES[1]!.id } },
    handler: ({ params, query }) => userComments(params.userId ?? '', query.cursor),
  },
  // P-022 (backend, 2026-10-20): a person's drafts (specs/drafts-tags), with their related ones.
  {
    method: 'GET',
    path: '/api/v1/users/:userId/drafts',
    kind: 'contract',
    implemented: true,
    schema: paginatedSchema(draftSchema),
    example: { ...noRequest, params: { userId: DEMO_USER.id } },
    handler: ({ params }) => listDrafts(params.userId ?? ''),
  },
  {
    method: 'POST',
    path: '/api/v1/drafts',
    kind: 'contract',
    implemented: true,
    schema: draftSchema,
    example: {
      ...noRequest,
      body: { userId: DEMO_USER.id, type: 'TEXT', title: 'Half a thought' },
    },
    handler: ({ body }) => createDraft(body),
  },
  {
    method: 'PATCH',
    path: '/api/v1/drafts/:draftId',
    kind: 'contract',
    implemented: true,
    schema: draftSchema,
    example: {
      ...noRequest,
      params: { draftId: SEED_DRAFT_ID },
      body: { userId: DEMO_USER.id, title: 'x' },
    },
    handler: ({ params, body }) => updateDraft(params.draftId ?? '', body),
  },
  {
    method: 'DELETE',
    path: '/api/v1/drafts/:draftId',
    kind: 'contract',
    implemented: true,
    schema: noContentSchema,
    example: {
      ...noRequest,
      params: { draftId: SEED_DRAFT_ID },
      query: { userId: DEMO_USER.id },
    },
    handler: ({ params, query }) => deleteDraft(params.draftId ?? '', query.userId),
  },
  // P-028 (proposal, specs/community-widgets): a group's widgets, saved whole by a moderator.
  {
    method: 'GET',
    path: '/api/v1/communities/:slug/widgets',
    kind: 'proposal',
    implemented: false,
    schema: widgetListSchema,
    example: { ...noRequest, params: { slug: 'trading-on-chain' } },
    handler: ({ params }) => listWidgets(params.slug ?? ''),
  },
  {
    method: 'PUT',
    path: '/api/v1/communities/:slug/widgets',
    kind: 'proposal',
    implemented: false,
    schema: widgetListSchema,
    example: {
      ...noRequest,
      params: { slug: 'trading-on-chain' },
      body: { userId: DEMO_USER.id, items: [] },
    },
    handler: ({ params, body }) => saveWidgets(params.slug ?? '', body),
  },
  // P-029 (proposal): where to put a widget's image.
  {
    method: 'POST',
    path: '/api/v1/uploads/community-image',
    kind: 'proposal',
    implemented: false,
    schema: communityImageUploadSchema,
    example: {
      ...noRequest,
      body: {
        userId: DEMO_USER.id,
        communityId: COMMUNITIES.find((each) => each.slug === 'trading-on-chain')!.id,
        contentType: 'image/webp',
        size: 120_000,
      },
    },
    handler: ({ body }) => signCommunityImageUpload(body),
  },
  // P-027 (backend, 2026-10-20): where a person published lately (specs/profile-aside).
  {
    method: 'GET',
    path: '/api/v1/users/:userId/active-communities',
    kind: 'contract',
    implemented: true,
    schema: activeCommunitiesSchema,
    example: {
      ...noRequest,
      params: { userId: PROFILES[1]!.id },
      query: { days: '90', limit: '20' },
    },
    handler: ({ params, query }) => activeCommunities(params.userId ?? '', query),
  },
  // P-030 (proposal, specs/profile-achievements): a person's trophy case.
  {
    method: 'GET',
    path: '/api/v1/users/:userId/achievements',
    kind: 'proposal',
    implemented: false,
    schema: achievementListSchema,
    example: { ...noRequest, params: { userId: DEMO_USER.id } },
    handler: ({ params }) => listAchievements(params.userId ?? ''),
  },
  // P-025 (backend, 2026-10-20): what a person put at the front of their profile (specs/profile-showcase).
  {
    method: 'GET',
    path: '/api/v1/users/:userId/featured',
    kind: 'contract',
    implemented: true,
    schema: featuredListSchema,
    example: { ...noRequest, params: { userId: PROFILES[1]!.id } },
    handler: ({ params }) => listFeatured(params.userId ?? ''),
  },
  {
    method: 'POST',
    path: '/api/v1/users/:userId/featured',
    kind: 'contract',
    implemented: true,
    schema: featuredListSchema,
    example: {
      ...noRequest,
      params: { userId: DEMO_USER.id },
      body: { userId: DEMO_USER.id, kind: 'post', id: DEMO_POST_ID },
    },
    handler: ({ params, body }) => addFeatured(params.userId ?? '', body),
  },
  {
    method: 'DELETE',
    path: '/api/v1/users/:userId/featured/:kind/:id',
    kind: 'contract',
    implemented: true,
    schema: noContentSchema,
    example: {
      ...noRequest,
      params: { userId: DEMO_USER.id, kind: 'post', id: DEMO_POST_ID },
      query: { userId: DEMO_USER.id },
    },
    handler: ({ params, query }) =>
      removeFeatured(params.userId ?? '', params.kind ?? '', params.id ?? '', query.userId),
  },
  // E01: editing your own profile (specs/profile-edit), for the demo viewer.
  {
    method: 'PATCH',
    path: '/api/v1/users/:userId',
    kind: 'contract',
    implemented: true,
    schema: userSchema,
    example: { ...noRequest, params: { userId: DEMO_USER.id }, body: { bio: 'Macro and rates.' } },
    handler: ({ params, body }) => updateUser(params.userId ?? '', body),
  },

  // E12: a person's theses, the newest first (specs/profile-track-record). No liveExample: the
  // route takes a userId, and the seed's ids are not known here.
  {
    method: 'GET',
    path: '/api/v1/users/:userId/theses',
    kind: 'contract',
    implemented: true,
    schema: paginatedSchema(thesisSchema),
    example: { ...noRequest, params: { userId: PROFILES[1]!.id } },
    handler: ({ params, query }) => {
      if (!PROFILES.some((each) => each.id === params.userId)) return notFound
      return { status: 200, body: paginate(thesesBy(params.userId ?? ''), query.cursor) }
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
          (!search ||
            each.name.toLowerCase().includes(search) ||
            each.slug.toLowerCase().includes(search)),
      ).sort((a, b) => b.memberCount - a.memberCount)
      // P-016 (backend, 2026-10-13): each with its main post.
      return { status: 200, body: paginate(filtered.map(withTopPost), query.cursor) }
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
      return community ? { status: 200, body: withTopPost(community) } : notFound
    },
  },

  // E04
  {
    method: 'GET',
    path: '/api/v1/feed/explore',
    kind: 'contract',
    implemented: true,
    schema: feedPageSchema,
    example: noRequest,
    // The feed the Home asks for: checks Post and Poll (community, commentCount), reason and
    // requestId on the real API.
    liveExample: { ...noRequest, query: { kind: 'POST,POLL' } },
    handler: ({ query }) => {
      // Backend dev: an unknown community answers an empty page, not a 404.
      if (query.community && !communityBySlug(query.community)) {
        return { status: 200, body: { items: [], nextCursor: null, requestId: null } }
      }
      const community = query.community ? communityBySlug(query.community) : undefined
      // A community's feed has no reason: only the Home's Explore says why (specs/explore-v1).
      const items = community
        ? FEED.filter((item) => item.content.communityId === community.id).map((item) => ({
            ...item,
            reason: null,
          }))
        : FEED.map(withReason)
      return {
        status: 200,
        body: feedPage(community ? 2 : 1, byKind(items, query.kind), query.cursor, !community),
      }
    },
  },
  {
    method: 'GET',
    path: '/api/v1/feed/following',
    kind: 'contract',
    implemented: true,
    schema: feedPageSchema,
    example: noRequest,
    // With mocks the viewer is always the demo user (src/lib/session.ts).
    handler: ({ query }) => {
      const items = FEED.filter((item) => MEMBER_OF.has(item.content.communityId)).map((item) => ({
        ...item,
        reason: null,
      }))
      return { status: 200, body: feedPage(3, byKind(items, query.kind), query.cursor, true) }
    },
  },
  {
    method: 'POST',
    path: '/api/v1/feed/impressions',
    kind: 'contract',
    implemented: true,
    schema: noContentSchema,
    example: {
      ...noRequest,
      body: {
        userId: DEMO_USER.id,
        requestId: requestIdOf(1, undefined),
        events: [{ contentId: POSTS[0]!.id, type: 'SEEN', dwellMs: 1200 }],
      },
    },
    // Auth is optional; what does not belong to the requestId is ignored without an error.
    handler: ({ body }) =>
      impressionsRequestSchema.safeParse(body).success ? { status: 204 } : validationError,
  },

  // E03 (entities on reads: proposal P-001)
  {
    method: 'POST',
    path: '/api/v1/posts',
    kind: 'contract',
    implemented: true,
    schema: postSchema,
    example: {
      ...noRequest,
      body: {
        userId: DEMO_USER.id,
        communityId: COMMUNITIES.find((each) => each.slug === 'defi')!.id,
        type: 'TEXT',
        title: 'Stablecoin yields are back above 8%',
        body: 'Where are they coming from? Lending demand, mostly.',
      },
    },
    handler: ({ body }) => createPost(body),
  },
  // P-013 (backend 2026-10-13): where to put a post image. With every route mocked nothing is
  // sent (post-image-upload): the URL is a placeholder and the image, the fixture.
  {
    method: 'POST',
    path: '/api/v1/uploads/post-image',
    kind: 'contract',
    implemented: true,
    schema: postImageUploadSchema,
    example: {
      ...noRequest,
      body: { userId: DEMO_USER.id, contentType: 'image/webp', size: 120_000 },
    },
    handler: ({ body }) => signPostImageUpload(body),
  },
  // P-021 (backend, 2026-10-20): where to put a profile photo or banner.
  {
    method: 'POST',
    path: '/api/v1/uploads/avatar',
    kind: 'contract',
    implemented: true,
    schema: profileImageUploadSchema,
    example: {
      ...noRequest,
      body: { userId: DEMO_USER.id, contentType: 'image/webp', size: 40_000 },
    },
    handler: ({ body }) => signProfileImageUpload('avatar', body),
  },
  {
    method: 'POST',
    path: '/api/v1/uploads/profile-banner',
    kind: 'contract',
    implemented: true,
    schema: profileImageUploadSchema,
    example: {
      ...noRequest,
      body: { userId: DEMO_USER.id, contentType: 'image/webp', size: 120_000 },
    },
    handler: ({ body }) => signProfileImageUpload('banner', body),
  },
  {
    method: 'GET',
    path: '/api/v1/posts/:id',
    kind: 'contract',
    implemented: true,
    schema: postSchema,
    example: { ...noRequest, params: { id: POSTS[0]!.id } },
    handler: ({ params }) => {
      const post = params.id ? findPost(params.id) : undefined
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
    method: 'GET',
    path: '/api/v1/communities/:slug/members',
    kind: 'contract',
    implemented: true,
    schema: paginatedSchema(communityMemberSchema),
    example: { ...noRequest, params: { slug: 'defi' } },
    // Public; a slug that does not exist is an empty list, as the backend (specs/community-members).
    handler: ({ params, query }) => ({
      status: 200,
      body: paginate(membersOf(params.slug ?? ''), query.cursor),
    }),
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
    // P-014 (backend, 2026-10-13): searching, a flat list. With API_MOCKS=missing it goes to the
    // backend; mocked, only the fixtures' comments are found.
    method: 'GET',
    path: '/api/v1/posts/:id/comments',
    kind: 'contract',
    implemented: true,
    when: (query) => query.q !== undefined,
    schema: commentListSchema,
    example: { ...noRequest, params: { id: POSTS[2]!.id }, query: { q: 'eth' } },
    handler: ({ params, query }) => {
      const q = (query.q ?? '').trim()
      if (q.length < 2 || q.length > 100) return validationError
      const items = params.id && findPost(params.id) ? searchComments(commentsOf(params.id), q) : []
      return { status: 200, body: { items } }
    },
  },
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
    handler: ({ params, query }) => {
      if (!params.id || !findPost(params.id)) return notFound
      const items = commentTree(commentsOf(params.id), query)
      // The whole tree carries its ads; a card's preview (?limit) does not.
      return { status: 200, body: query.limit ? { items } : { items, ads: treeAds(items) } }
    },
  },
  {
    method: 'POST',
    path: '/api/v1/posts/:id/comments',
    kind: 'contract',
    implemented: true,
    schema: createdCommentSchema,
    example: {
      ...noRequest,
      params: { id: POSTS[0]!.id },
      body: { userId: DEMO_USER.id, body: 'Agree, the flows say so.' },
    },
    handler: ({ params, body }) => createComment(params.id ?? '', body),
  },
  {
    method: 'POST',
    path: '/api/v1/polls/:id/comments',
    kind: 'contract',
    implemented: true,
    schema: createdCommentSchema,
    example: {
      ...noRequest,
      params: { id: POLLS[0]!.id },
      body: { userId: DEMO_USER.id, body: 'I voted the middle one.' },
    },
    handler: ({ params, body }) => createComment(params.id ?? '', body),
  },
  {
    method: 'PUT',
    path: '/api/v1/comments/:id/vote',
    kind: 'contract',
    implemented: true,
    schema: voteResultSchema,
    example: {
      ...noRequest,
      params: { id: COMMENTS_BY_CONTENT[POSTS[0]!.id]![0]!.id },
      body: { userId: DEMO_USER.id, value: 1 },
    },
    handler: ({ params, body }) => voteComment(params.id ?? '', body),
  },
  {
    method: 'DELETE',
    path: '/api/v1/comments/:id/vote',
    kind: 'contract',
    implemented: true,
    schema: noContentSchema,
    example: {
      ...noRequest,
      params: { id: COMMENTS_BY_CONTENT[POSTS[0]!.id]![0]!.id },
      query: { userId: DEMO_USER.id },
    },
    handler: ({ params, query }) => removeCommentVote(params.id ?? '', query.userId),
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

  // E04: simple search, used for @ in mentions (specs/mention-autocomplete). Private profiles
  // never show (the backend hides them). Content is not searched by the mocks.
  {
    method: 'GET',
    path: '/api/v1/search',
    kind: 'contract',
    implemented: true,
    schema: searchResultSchema,
    example: { ...noRequest, query: { q: 'mar', type: 'user' } },
    liveExample: { ...noRequest, query: { q: 'a', type: 'user' } },
    handler: ({ query }) => {
      const q = query.q?.trim().toLowerCase() ?? ''
      const wants = (type: string) => q !== '' && (!query.type || query.type === type)
      const users = wants('user')
        ? PROFILES.filter((each) => each.isPublic && each.username.toLowerCase().includes(q))
            .slice(0, 10)
            .map((each) => summary(each.username))
        : []
      const communities = wants('community')
        ? COMMUNITIES.filter(
            (each) => each.slug.toLowerCase().includes(q) || each.name.toLowerCase().includes(q),
          )
            .slice(0, 10)
            .map(({ id, slug, name, avatarUrl, memberCount }) => ({
              id,
              slug,
              name,
              avatarUrl,
              memberCount,
            }))
        : []
      return { status: 200, body: { users, communities, content: [] } }
    },
  },
  // E14: the catalog and autocomplete of $ (specs/mention-autocomplete). In the backend's dev,
  // without a cursor.
  {
    method: 'GET',
    path: '/api/v1/assets',
    kind: 'contract',
    implemented: true,
    schema: assetCatalogSchema,
    example: { ...noRequest, query: { q: 'b' } },
    liveExample: { ...noRequest, query: { q: 'b' } },
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
    // In the backend's dev since 2026-10-13, with the 100 assets of the catalog.
    implemented: true,
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

/**
 * The page of a real feed with its proposals on top: the ads (P-031) and, in the Home, the glossary
 * terms (P-032). Its items are left as they came: the client validates them afterwards.
 */
function extendFeed(response: MockResponse, home: boolean): MockResponse {
  const body = response.body
  if (response.status !== 200 || typeof body !== 'object' || body === null) return response
  if (!('items' in body) || !Array.isArray(body.items)) return response
  const withAds = withFeedAds(body.items)
  return { ...response, body: { ...body, items: home ? withGlossary(withAds) : withAds } }
}

/**
 * Proposals on top of implemented endpoints, with API_MOCKS=missing: the backend answers and these
 * add what it does not send yet (api-integration.md § Mocks), so the ads and the glossary show
 * with real data in development and in develop (specs/glossary GL-07). With every route mocked the
 * handlers above already add them.
 */
export const MOCK_EXTENSIONS: readonly MockExtension[] = [
  {
    method: 'GET',
    path: '/api/v1/feed/explore',
    extend: (response, { query }) => extendFeed(response, !query.community),
  },
  {
    method: 'GET',
    path: '/api/v1/feed/following',
    extend: (response) => extendFeed(response, true),
  },
  {
    method: 'GET',
    path: '/api/v1/users/:userId/content',
    extend: (response) => extendFeed(response, false),
  },
]
