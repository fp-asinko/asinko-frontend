import type {
  RawCommunity,
  RawFeedItem,
  RawPoll,
  RawPost,
  RawUserSummary,
} from '@/lib/api/contract'
import type { Author, CommunityRef, FeedItem, PollItem, PostItem, PostMedia } from '../feed.types'
import { markMentions, type MentionLookup } from './mentions'

/** Communities by id, plus the lookups mentions need. Built once per feed page. */
export type CommunityIndex = MentionLookup & { byId: (id: string) => CommunityRef | null }

/** The mention handle of a community: $ for an asset, # for a group (overview.md § Menciones). */
function toCommunityRef(community: RawCommunity): CommunityRef {
  return {
    slug: community.slug,
    name: community.name,
    handle:
      community.type === 'SYSTEM_ASSET' ? `$${community.slug.toUpperCase()}` : `#${community.slug}`,
  }
}

export function indexCommunities(communities: readonly RawCommunity[]): CommunityIndex {
  const byId = new Map(communities.map((each) => [each.id, each]))
  const byAsset = new Map(
    communities.flatMap((each) => (each.assetId ? [[each.assetId, each.slug] as const] : [])),
  )
  return {
    byId: (id) => {
      const community = byId.get(id)
      return community ? toCommunityRef(community) : null
    },
    communitySlug: (id) => byId.get(id)?.slug,
    communityOfAsset: (assetId) => byAsset.get(assetId),
  }
}

type RawAuthor = Pick<RawUserSummary, 'username' | 'avatarUrl'> & { accuracyRate?: number | null }

function toAuthor(user: RawAuthor | null): Author | null {
  if (!user) return null
  return {
    username: user.username,
    handle: `@${user.username}`,
    avatarUrl: user.avatarUrl,
    accuracyRate: user.accuracyRate ?? null,
  }
}

/** Only same-site paths and https images; anything else is dropped. */
function safeImageUrl(url: string | null): string | null {
  if (!url) return null
  if (url.startsWith('/') && !url.startsWith('//')) return url
  try {
    return new URL(url).protocol === 'https:' ? url : null
  } catch {
    return null
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
    const url = safeImageUrl(post.imageUrl)
    return url ? { type: 'image', url } : null
  }
  if (post.type === 'LINK') return safeLink(post.url)
  return null
}

export function toPostItem(post: RawPost, communities: CommunityIndex): PostItem {
  return {
    kind: 'post',
    id: post.id,
    title: post.title,
    body: post.deleted ? '' : markMentions(post.body, post.entities, communities),
    author: post.creatorType === 'SYSTEM' ? null : toAuthor(post.creator),
    community: communities.byId(post.communityId),
    tag: post.tag,
    media: toMedia(post),
    score: post.score,
    viewerVote: post.viewerVote,
    commentCount: post.commentCount,
    publishedAt: post.publishedAt,
    edited: post.editedAt !== null,
    deleted: post.deleted,
  }
}

export function toPollItem(poll: RawPoll, communities: CommunityIndex): PollItem {
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
    resultsVisible,
    isClosed: poll.isClosed,
    closesAt: poll.closesAt,
    author: poll.creatorType === 'SYSTEM' ? null : toAuthor(poll.creator),
    community: communities.byId(poll.communityId),
    publishedAt: poll.publishedAt,
  }
}

export function toFeedItem(item: RawFeedItem, communities: CommunityIndex): FeedItem {
  return item.kind === 'POST'
    ? toPostItem(item.content, communities)
    : toPollItem(item.content, communities)
}
