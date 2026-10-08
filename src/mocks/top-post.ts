import type { RawCommunity } from '@/lib/api/contract'
import { MOCK_NOW } from './fixtures/ids'
import { POSTS } from './fixtures/posts'

const WEEK = 7 * 24 * 60 * 60_000

/**
 * P-016 (proposal): a community's main post, what the left column shows under it
 * (specs/interests-refresh IR-01): the most voted of the last 7 days, or else the newest.
 */
export function topPostOf(communityId: string): RawCommunity['topPost'] {
  const posts = POSTS.filter((post) => post.communityId === communityId && !post.deleted)
  if (posts.length === 0) return null
  const recent = posts.filter((post) => MOCK_NOW - Date.parse(post.createdAt) <= WEEK)
  const pick = recent.length
    ? recent.reduce((best, post) => (post.score > best.score ? post : best))
    : posts.reduce((newest, post) => (post.createdAt > newest.createdAt ? post : newest))
  return { id: pick.id, title: pick.title }
}

/** A community as the backend will send it with P-016. */
export function withTopPost(community: RawCommunity): RawCommunity {
  return { ...community, topPost: topPostOf(community.id) }
}
