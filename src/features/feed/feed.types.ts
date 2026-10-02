// Domain types of the Home feed (specs/home/design.md § 5 and § 6). The UI only knows these, never
// the raw contract shapes.

export type Author = {
  username: string
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

export type PostMedia =
  | { type: 'image'; url: string }
  /** Only http(s) links; `domain` is shown so the text cannot disguise the destination. */
  | { type: 'link'; url: string; domain: string }

export type PostItem = {
  kind: 'post'
  id: string
  title: string
  /** Markdown, with the resolved mentions turned into `asinko:` links (lib/mentions.ts). */
  body: string
  /** null for system posts. */
  author: Author | null
  /** null when the community could not be resolved. */
  community: CommunityRef | null
  tag: string | null
  media: PostMedia | null
  score: number
  viewerVote: 1 | -1 | null
  commentCount: number
  publishedAt: string
  edited: boolean
  deleted: boolean
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
  /** False when the results stay hidden until voting (ON_VOTE) or closing (ON_CLOSE). */
  resultsVisible: boolean
  isClosed: boolean
  closesAt: string | null
  author: Author | null
  community: CommunityRef | null
  publishedAt: string
}

export type FeedItem = PostItem | PollItem

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
}
