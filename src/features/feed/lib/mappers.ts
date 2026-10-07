import { communityPath, kindOf } from '@/lib/communities/paths'
import { allowedImageUrl } from '@/lib/images'
import type {
  RawCommunity,
  RawCommunitySummary,
  RawFeedItem,
  RawPoll,
  RawPost,
  RawUserSummary,
} from '@/lib/api/contract'
import type {
  Author,
  CardCommunity,
  CommunityRef,
  FeedItem,
  PollItem,
  PollResults,
  PostItem,
  PostMedia,
} from '../feed.types'
import { markMentions, type MentionLookup } from './mentions'

/** The mention handle of a community: $ for an asset, # for a group (overview.md § Menciones). */
export function toCommunityRef(
  community: Pick<RawCommunity, 'slug' | 'name' | 'type'>,
): CommunityRef {
  return {
    slug: community.slug,
    name: community.name,
    handle:
      community.type === 'SYSTEM_ASSET' ? `$${community.slug.toUpperCase()}` : `#${community.slug}`,
  }
}

/**
 * What mentions need to link: the slug of a community by id and of an asset's community. Cards
 * take their own community from the content (P-004); this is only for `entities` (P-001).
 */
export function indexCommunities(communities: readonly RawCommunity[]): MentionLookup {
  const byId = new Map(communities.map((each) => [each.id, each.slug]))
  const byAsset = new Map(
    communities.flatMap((each) => (each.assetId ? [[each.assetId, each.slug] as const] : [])),
  )
  return {
    communitySlug: (id) => byId.get(id),
    communityOfAsset: (assetId) => byAsset.get(assetId),
  }
}

/**
 * What the cards need to know about their communities until P-010 sends it in each summary
 * (specs/community-first CF-12): avatars from GET /communities and membership from ?mine=true.
 */
export type CardLookup = {
  signedIn: boolean
  avatarOf: (id: string) => string | null | undefined
  isMember: (id: string) => boolean
}

export const NO_CARD_LOOKUP: CardLookup = {
  signedIn: false,
  avatarOf: () => undefined,
  isMember: () => false,
}

export function indexCardCommunities(
  communities: readonly RawCommunity[],
  mine: readonly RawCommunity[],
  signedIn: boolean,
): CardLookup {
  const avatars = new Map([...communities, ...mine].map((each) => [each.id, each.avatarUrl]))
  const member = new Set(mine.filter((each) => each.viewerMembership).map((each) => each.id))
  return { signedIn, avatarOf: (id) => avatars.get(id), isMember: (id) => member.has(id) }
}

export function toCardCommunity(summary: RawCommunitySummary, cards: CardLookup): CardCommunity {
  // The summary wins when the backend sends the field (P-010); the lists are the fallback.
  const avatarUrl = summary.avatarUrl !== undefined ? summary.avatarUrl : cards.avatarOf(summary.id)
  const member =
    summary.viewerMembership !== undefined
      ? summary.viewerMembership !== null
      : cards.isMember(summary.id)
  return {
    ...toCommunityRef(summary),
    path: communityPath(kindOf(summary.type), summary.slug),
    avatarUrl: allowedImageUrl(avatarUrl ?? null),
    personal: summary.type === 'PERSONAL_CHANNEL',
    viewerIsMember: cards.signedIn ? member : null,
  }
}

type RawAuthor = Pick<RawUserSummary, 'username' | 'avatarUrl'> & { accuracyRate?: number | null }

function toAuthor(user: RawAuthor | null): Author | null {
  if (!user) return null
  return {
    username: user.username,
    handle: `@${user.username}`,
    avatarUrl: allowedImageUrl(user.avatarUrl),
    accuracyRate: user.accuracyRate ?? null,
  }
}

/** Only http(s) links, with the real domain to show (security.md § 1). */
function safeLink(url: string | null): Extract<PostMedia, { type: 'link' }> | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null
    return { type: 'link', url: parsed.href, domain: parsed.hostname.replace(/^www\./, '') }
  } catch {
    return null
  }
}

function toMedia(post: RawPost): PostMedia | null {
  if (post.deleted) return null
  if (post.type === 'IMAGE') {
    const url = allowedImageUrl(post.imageUrl)
    return url ? { type: 'image', url } : null
  }
  if (post.type === 'LINK') return safeLink(post.url)
  return null
}

export function toPostItem(
  post: RawPost,
  mentions: MentionLookup,
  cards: CardLookup = NO_CARD_LOOKUP,
): PostItem {
  return {
    kind: 'post',
    id: post.id,
    title: post.title,
    body: post.deleted ? '' : markMentions(post.body, post.entities, mentions),
    author: post.creatorType === 'SYSTEM' ? null : toAuthor(post.creator),
    community: toCardCommunity(post.community, cards),
    media: toMedia(post),
    score: post.score,
    viewerVote: post.viewerVote,
    commentCount: post.commentCount,
    publishedAt: post.publishedAt,
    edited: post.editedAt !== null,
    deleted: post.deleted,
  }
}

export function toPollItem(poll: RawPoll, cards: CardLookup = NO_CARD_LOOKUP): PollItem {
  const total = poll.totalVotes
  const resultsVisible = poll.options.every((option) => option.voteCount !== null) && total !== null
  return {
    kind: 'poll',
    id: poll.id,
    question: poll.question,
    options: [...poll.options]
      .sort((a, b) => a.position - b.position)
      .map((option) => ({
        id: option.id,
        label: option.label,
        votes: option.voteCount,
        share:
          resultsVisible && option.voteCount !== null
            ? total
              ? option.voteCount / total
              : 0
            : null,
      })),
    totalVotes: total,
    viewerOptionId: poll.viewerOptionId,
    allowVoteChange: poll.allowVoteChange,
    resultsVisible,
    isClosed: poll.isClosed,
    closesAt: poll.closesAt,
    commentCount: poll.commentCount,
    author: poll.creatorType === 'SYSTEM' ? null : toAuthor(poll.creator),
    community: toCardCommunity(poll.community, cards),
    publishedAt: poll.publishedAt,
  }
}

/** The part of a poll a vote changes (the vote endpoint answers the whole poll). */
export function toPollResults(poll: RawPoll): PollResults {
  const { options, totalVotes, viewerOptionId, resultsVisible } = toPollItem(poll)
  return { options, totalVotes, viewerOptionId, resultsVisible }
}

export function toFeedItem(
  item: RawFeedItem,
  mentions: MentionLookup,
  cards: CardLookup = NO_CARD_LOOKUP,
): FeedItem {
  return item.kind === 'POST'
    ? toPostItem(item.content, mentions, cards)
    : toPollItem(item.content, cards)
}
