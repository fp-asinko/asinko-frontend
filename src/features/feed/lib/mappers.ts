import { allowedImageUrl } from '@/lib/images'
import type {
  RawCommunity,
  RawFeedItem,
  RawPoll,
  RawPost,
  RawUserSummary,
} from '@/lib/api/contract'
import type {
  Author,
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

export function toPostItem(post: RawPost, mentions: MentionLookup): PostItem {
  return {
    kind: 'post',
    id: post.id,
    title: post.title,
    body: post.deleted ? '' : markMentions(post.body, post.entities, mentions),
    author: post.creatorType === 'SYSTEM' ? null : toAuthor(post.creator),
    community: toCommunityRef(post.community),
    media: toMedia(post),
    score: post.score,
    viewerVote: post.viewerVote,
    commentCount: post.commentCount,
    publishedAt: post.publishedAt,
    edited: post.editedAt !== null,
    deleted: post.deleted,
  }
}

export function toPollItem(poll: RawPoll): PollItem {
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
    community: toCommunityRef(poll.community),
    publishedAt: poll.publishedAt,
  }
}

/** The part of a poll a vote changes (the vote endpoint answers the whole poll). */
export function toPollResults(poll: RawPoll): PollResults {
  const { options, totalVotes, viewerOptionId, resultsVisible } = toPollItem(poll)
  return { options, totalVotes, viewerOptionId, resultsVisible }
}

export function toFeedItem(item: RawFeedItem, mentions: MentionLookup): FeedItem {
  return item.kind === 'POST' ? toPostItem(item.content, mentions) : toPollItem(item.content)
}

/** Whether a page has mentions that need community slugs to link ($ and #, not @). */
export function needsMentionLookup(items: readonly RawFeedItem[]): boolean {
  return items.some(
    (item) =>
      item.kind === 'POST' &&
      (item.content.entities ?? []).some((entity) => entity.type !== 'MENTION'),
  )
}
