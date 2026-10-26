// Domain types of the Home feed (specs/home/design.md § 5 and § 6). The UI only knows these, never
// the raw contract shapes.

import type { CommunityKind } from '@/lib/communities/paths'

export type Author = {
  username: string
  /** The profile: /user/{username} (specs/community-pages CP-21). */
  path: string
  /** How it is mentioned: @maria */
  handle: string
  avatarUrl: string | null
  accuracyRate: number | null
}

export type CommunityRef = {
  slug: string
  name: string
  /** $BTC for an asset community, #defi for a group. */
  handle: string
}

/** The community of a card (specs/community-first): the protagonist of its header. */
export type CardCommunity = CommunityRef & {
  /** Its page: /hub/{slug} or /asset/{SYMBOL} (specs/community-pages CP-14). */
  path: string
  avatarUrl: string | null
  /** Its page and its hover card: group or asset (or user, a personal channel). */
  kind: CommunityKind
  /** The personal channel of a user: no group to show nor to join. */
  personal: boolean
  /** null without a session: the join button shows and opens the account modal. */
  viewerIsMember: boolean | null
}

/**
 * Why Explore shows a card (specs/explore-v1): only the reasons the card does not tell by itself
 * (Q1). A community the viewer follows brought it, or it is popular in their country.
 */
export type FeedReason =
  | { type: 'similar'; community: { handle: string; path: string } }
  | { type: 'country'; countryCode: string }

export type PostMedia =
  /** `alt`: what the image shows, written by its author (imageAlt); null without one. */
  | { type: 'image'; url: string; alt: string | null }
  /** Only http(s) links; `domain` is shown so the text cannot disguise the destination. */
  | { type: 'link'; url: string; domain: string }

export type PostItem = {
  kind: 'post'
  id: string
  /** A thought (specs/thoughts): no title (""), its text as a quote, its own card and badge. */
  thought: boolean
  title: string
  /** Its page: /post/{id}/{slug} (specs/post-create-detail § 1). */
  path: string
  /** Markdown, with the resolved mentions turned into `asinko:` links (lib/mentions.ts). */
  body: string
  /** null for system posts. */
  author: Author | null
  /** null when the community could not be resolved. */
  community: CardCommunity | null
  media: PostMedia | null
  score: number
  viewerVote: 1 | -1 | null
  commentCount: number
  publishedAt: string
  edited: boolean
  deleted: boolean
  /** Its tag, beside the title (P-023, specs/drafts-tags DT-10); null without one. */
  tag: string | null
  /** The communities and assets its author tagged it with (P-018), as mentions with their page. */
  related: { handle: string; path: string }[]
  /** Why the Home's Explore shows it (specs/explore-v1); absent or null anywhere else. */
  reason?: FeedReason | null
}

export type PollOption = {
  id: string
  label: string
  /** null while the results are hidden from the viewer. */
  votes: number | null
  /** 0–1, null while hidden. */
  share: number | null
}

export type PollItem = {
  kind: 'poll'
  id: string
  question: string
  options: PollOption[]
  totalVotes: number | null
  viewerOptionId: string | null
  /** Whether the viewer can change a vote already cast. */
  allowVoteChange: boolean
  /** False when the results stay hidden until voting (ON_VOTE) or closing (ON_CLOSE). */
  resultsVisible: boolean
  isClosed: boolean
  closesAt: string | null
  /** Without deleted comments (P-006). */
  commentCount: number
  author: Author | null
  community: CardCommunity | null
  publishedAt: string
  /** Why the Home's Explore shows it (specs/explore-v1); absent or null anywhere else. */
  reason?: FeedReason | null
}

/** What changes in a poll after voting. */
export type PollResults = Pick<
  PollItem,
  'options' | 'totalVotes' | 'viewerOptionId' | 'resultsVisible'
>

/**
 * An ad where the backend puts it: in a feed, or after a comment (specs/ads). Only http(s) links,
 * with the real domain to show (AD-06).
 */
export type AdItem = {
  kind: 'ad'
  id: string
  advertiser: string
  logoUrl: string | null
  body: string | null
  url: string
  domain: string
  image: { src: string; width: number; height: number; alt: string } | null
}

/** A glossary term, the platform's own content, in the Home's feeds (specs/glossary). */
export type GlossaryItem = {
  kind: 'glossary'
  id: string
  term: string
  category: string
  definition: string
  example: string | null
}

export type FeedItem = PostItem | PollItem | AdItem | GlossaryItem

/** A comment of the card's preview (H-28): top level only, never deleted. */
export type CommentPreview = {
  id: string
  author: Author
  /** Markdown. Comments carry no entities, so mentions show as plain text. */
  body: string
  createdAt: string
}

export type FeedPage = {
  items: FeedItem[]
  nextCursor: string | null
  /** The filtered community (?community=), when there is one. */
  community: CommunityRef | null
  /** The page the impressions refer to (specs/explore-v1); null for an empty page or a profile. */
  requestId: string | null
}

/** A comment of a post's page, with its replies (specs/post-create-detail § 4). */
export type CommentNode = {
  id: string
  /** null when deleted: the comment stays only to hold its replies. */
  author: Author | null
  /** Markdown; empty when deleted. */
  body: string
  createdAt: string
  edited: boolean
  deleted: boolean
  score: number
  viewerVote: 1 | -1 | null
  replies: CommentNode[]
  /** The ad that goes right after it, before its replies (specs/ads AD-04). */
  ad?: AdItem
}

/** A person's comment on their profile, out of its thread (specs/backend-adoption BK-03). */
export type UserReply = {
  id: string
  /** Markdown, as a comment's. */
  body: string
  score: number
  createdAt: string
  edited: boolean
  /** Where it is: the post's (or poll's) title; a path only for a post, to the comment itself. */
  where: { title: string; path: string | null; community: CardCommunity | null }
}
