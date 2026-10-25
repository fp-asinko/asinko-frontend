import type { Author, CommentNode, PollItem, PostItem } from './feed.types'

// Domain items for component tests (the mappers have their own tests against the mock fixtures).

export const MARIA: Author = {
  username: 'maria',
  path: '/user/maria',
  handle: '@maria',
  avatarUrl: null,
  accuracyRate: 0.74,
}

export function postItem(overrides: Partial<PostItem> = {}): PostItem {
  return {
    kind: 'post',
    id: 'post-1',
    thought: false,
    title: 'Whales accumulated 48,000 $BTC',
    path: '/post/post-1/whales-accumulated-48-000-btc',
    body: 'Long [$BTC](asinko:asset/BTC) for now.',
    author: MARIA,
    community: {
      slug: 'BTC',
      name: 'Bitcoin',
      handle: '$BTC',
      path: '/asset/BTC',
      kind: 'asset',
      avatarUrl: null,
      personal: false,
      viewerIsMember: false,
    },
    media: null,
    score: 1284,
    viewerVote: null,
    commentCount: 6,
    publishedAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
    edited: false,
    deleted: false,
    tag: null,
    related: [],
    ...overrides,
  }
}

export function pollItem(overrides: Partial<PollItem> = {}): PollItem {
  return {
    kind: 'poll',
    id: 'poll-1',
    question: 'Where does $BTC close 2026?',
    options: [
      { id: 'a', label: 'Above 150K', votes: 25, share: 0.25 },
      { id: 'b', label: 'Below 150K', votes: 75, share: 0.75 },
    ],
    totalVotes: 100,
    viewerOptionId: null,
    allowVoteChange: true,
    resultsVisible: true,
    isClosed: false,
    closesAt: new Date(Date.now() + 4 * 86400_000).toISOString(),
    commentCount: 12,
    author: null,
    community: {
      slug: 'BTC',
      name: 'Bitcoin',
      handle: '$BTC',
      path: '/asset/BTC',
      kind: 'asset',
      avatarUrl: null,
      personal: false,
      viewerIsMember: false,
    },
    publishedAt: new Date(Date.now() - 86400_000).toISOString(),
    ...overrides,
  }
}

let commentCount = 0

/** A comment of the detail, with unique id and body ("Comment 1", "Comment 2"…). */
export function commentNode(
  overrides: Partial<CommentNode> = {},
  replies: CommentNode[] = [],
): CommentNode {
  commentCount += 1
  return {
    id: `00000000-0000-4000-8000-${String(commentCount).padStart(12, '0')}`,
    author: MARIA,
    body: `Comment ${commentCount}`,
    createdAt: new Date().toISOString(),
    edited: false,
    deleted: false,
    score: 1,
    viewerVote: null,
    replies,
    ...overrides,
  }
}
