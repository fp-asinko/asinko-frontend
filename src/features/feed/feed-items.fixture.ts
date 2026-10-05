import type { Author, PollItem, PostItem } from './feed.types'

// Domain items for component tests (the mappers have their own tests against the mock fixtures).

export const MARIA: Author = {
  username: 'maria',
  handle: '@maria',
  avatarUrl: null,
  accuracyRate: 0.74,
}

export function postItem(overrides: Partial<PostItem> = {}): PostItem {
  return {
    kind: 'post',
    id: 'post-1',
    title: 'Whales accumulated 48,000 $BTC',
    body: 'Long [$BTC](asinko:community/btc) for now.',
    author: MARIA,
    community: { slug: 'btc', name: 'Bitcoin', handle: '$BTC' },
    media: null,
    score: 1284,
    viewerVote: null,
    commentCount: 6,
    publishedAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
    edited: false,
    deleted: false,
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
    community: { slug: 'btc', name: 'Bitcoin', handle: '$BTC' },
    publishedAt: new Date(Date.now() - 86400_000).toISOString(),
    ...overrides,
  }
}
