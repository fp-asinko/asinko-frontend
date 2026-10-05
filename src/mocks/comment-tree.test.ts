// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { COMMENTS_BY_CONTENT } from './fixtures/comments'
import { POSTS } from './fixtures/posts'
import { commentTree } from './comment-tree'

// The whales post has a thread with nested replies and a deleted comment.
const roots = COMMENTS_BY_CONTENT[POSTS[0]!.id]!

describe('commentTree (P-007, as the backend dev)', () => {
  it('returns the whole tree without parameters', () => {
    expect(commentTree(roots, {})).toEqual(roots)
  })

  it('caps the roots with limit and drops the replies with replies=false', () => {
    const tree = commentTree(roots, { limit: '2', replies: 'false' })
    expect(tree).toHaveLength(2)
    for (const comment of tree) expect(comment.replies).toEqual([])
    // replyCount still says there is more to load.
    expect(tree.some((comment) => comment.replyCount > 0)).toBe(true)
  })

  it('keeps the replies under a limit unless replies is the literal "false"', () => {
    expect(commentTree(roots, { limit: '1', replies: '0' })[0]!.replies).toEqual(roots[0]!.replies)
  })

  it.each(['0', '-3', '1.5', 'abc'])('ignores an invalid limit (%s)', (limit) => {
    expect(commentTree(roots, { limit })).toHaveLength(roots.length)
  })
})
