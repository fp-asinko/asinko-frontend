import { communityPath, kindOf, mentionOf } from '@/lib/communities/paths'
import { allowedImageUrl } from '@/lib/images'
import { postPath } from '@/lib/posts/paths'
import type {
  RawCommunity,
  RawCommunitySummary,
  RawAd,
  RawFeedItem,
  RawFeedReason,
  RawPoll,
  RawPost,
  RawUserSummary,
} from '@/lib/api/contract'
import type {
  Author,
  CardCommunity,
  CommunityRef,
  AdItem,
  FeedItem,
  FeedReason,
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
    // An asset's symbol from its name, never from its slug (specs/backend-answer-1020 BA-10).
    handle: mentionOf(community).handle,
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
 * The community of a card, from the summary every content carries (P-004, P-010). Without a
 * session there is no membership, whatever the response says (the backend sends null; the mocks
 * answer as the demo user).
 */
export function toCardCommunity(summary: RawCommunitySummary, signedIn: boolean): CardCommunity {
  return {
    ...toCommunityRef(summary),
    kind: kindOf(summary.type),
    path: mentionOf(summary).path,
    avatarUrl: allowedImageUrl(summary.avatarUrl),
    personal: summary.type === 'PERSONAL_CHANNEL',
    viewerIsMember: signedIn ? summary.viewerMembership !== null : null,
  }
}

type RawAuthor = Pick<RawUserSummary, 'username' | 'avatarUrl'> & { accuracyRate?: number | null }

export function toAuthor(user: RawAuthor | null): Author | null {
  if (!user) return null
  return {
    username: user.username,
    path: communityPath('user', user.username),
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
    return url ? { type: 'image', url, alt: post.imageAlt?.trim() || null } : null
  }
  if (post.type === 'LINK') return safeLink(post.url)
  return null
}

export function toPostItem(post: RawPost, mentions: MentionLookup, signedIn = false): PostItem {
  return {
    kind: 'post',
    id: post.id,
    thought: post.type === 'THOUGHT',
    title: post.title,
    // A thought has no title: its readable path comes from its text (specs/thoughts TH-08).
    path: postPath(post.id, post.type === 'THOUGHT' ? post.body : post.title),
    body: post.deleted ? '' : markMentions(post.body, post.entities, mentions),
    author: post.creatorType === 'SYSTEM' ? null : toAuthor(post.creator),
    community: toCardCommunity(post.community, signedIn),
    media: toMedia(post),
    score: post.score,
    viewerVote: post.viewerVote,
    commentCount: post.commentCount,
    publishedAt: post.publishedAt,
    edited: post.editedAt !== null,
    deleted: post.deleted,
    tag: post.tag?.trim() || null,
    related: post.deleted ? [] : (post.related ?? []).map(mentionOf),
  }
}

export function toPollItem(poll: RawPoll, signedIn = false): PollItem {
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
    community: toCardCommunity(poll.community, signedIn),
    publishedAt: poll.publishedAt,
  }
}

/** The part of a poll a vote changes (the vote endpoint answers the whole poll). */
export function toPollResults(poll: RawPoll): PollResults {
  const { options, totalVotes, viewerOptionId, resultsVisible } = toPollItem(poll)
  return { options, totalVotes, viewerOptionId, resultsVisible }
}

/**
 * The reason a card shows (specs/explore-v1 Q1, EX-02): a community the viewer follows brought it
 * (SIMILAR, with its `via`), or it is popular in their country (COUNTRY, with its code). FOLLOWING
 * is already in the card's header and TRENDING is most of the feed: no line for them, nor for
 * anything incomplete or unknown.
 */
export function toFeedReason(reason: RawFeedReason | null | undefined): FeedReason | null {
  if (reason?.type === 'SIMILAR' && reason.via) {
    return { type: 'similar', community: mentionOf(reason.via) }
  }
  if (reason?.type === 'COUNTRY' && reason.countryCode) {
    return { type: 'country', countryCode: reason.countryCode }
  }
  return null
}

/**
 * An ad as the UI draws it (specs/ads): only an http(s) link, with its real domain to show (AD-06,
 * security.md § 1). null for any other link: the ad is left out.
 */
export function toAdItem(ad: RawAd): AdItem | null {
  let url: URL
  try {
    url = new URL(ad.url)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  return {
    kind: 'ad',
    id: ad.id,
    advertiser: ad.advertiser.name,
    logoUrl: ad.advertiser.logoUrl,
    body: ad.body,
    url: url.href,
    domain: url.hostname.replace(/^www./, ''),
    image: ad.image && {
      src: ad.image.url,
      width: ad.image.width,
      height: ad.image.height,
      alt: ad.image.alt,
    },
  }
}

/** `explained`: the Home's Explore, the only feed that says why it shows a card (EX-03). */
export function toFeedItem(
  item: RawFeedItem,
  mentions: MentionLookup,
  signedIn = false,
  explained = false,
): FeedItem | null {
  // An ad as it comes (specs/ads AD-01); null when its link is not http(s) (AD-06).
  if (item.kind === 'AD') return toAdItem(item.content)
  const reason = explained ? toFeedReason(item.reason) : null
  // A thought is a post with its own card (specs/thoughts): toPostItem reads its type.
  return item.kind === 'POLL'
    ? { ...toPollItem(item.content, signedIn), reason }
    : { ...toPostItem(item.content, mentions, signedIn), reason }
}

/** Whether a page has mentions that need community slugs to link ($ and #, not @). */
export function needsMentionLookup(items: readonly RawFeedItem[]): boolean {
  return items.some(
    (item) =>
      (item.kind === 'POST' || item.kind === 'THOUGHT') &&
      (item.content.entities ?? []).some((entity) => entity.type !== 'MENTION'),
  )
}
