import type { CommentAd, CommentNode } from '../feed.types'
import { FOLD_DEPTH } from './comment-fold'

/** One ad after every this many comments (PO, specs/post-detail-refresh PD-07). */
export const AD_EVERY = 10

/**
 * Puts an ad after every 10th comment in reading order, replies included (PD-07): the ad is what
 * is read next, so it goes before that comment's replies when they show, or after it. Folded
 * replies (from level 4) do not show, so they do not count. The ads rotate; without ads, the
 * comments stay as they were.
 */
export function withAds(
  comments: readonly CommentNode[],
  ads: readonly CommentAd[],
  every = AD_EVERY,
): CommentNode[] {
  if (ads.length === 0) return [...comments]
  let read = 0
  let shown = 0

  function walk(list: readonly CommentNode[], depth: number): CommentNode[] {
    return list.map((comment) => {
      read += 1
      const ad = read % every === 0 ? ads[shown++ % ads.length] : undefined
      // The replies of a comment at the fold depth start folded: they are not read here.
      const replies = depth + 1 < FOLD_DEPTH ? walk(comment.replies, depth + 1) : comment.replies
      return { ...comment, replies, ...(ad && { ad }) }
    })
  }

  return walk(comments, 0)
}
