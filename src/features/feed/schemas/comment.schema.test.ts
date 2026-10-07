// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { createCommentSchema } from './comment.schema'

const POST = '00000000-0000-4000-8000-000000004001'

describe('createCommentSchema', () => {
  it('accepts a comment and a reply, trimmed', () => {
    expect(
      createCommentSchema.parse({ postId: POST, parentCommentId: null, body: ' Yes ' }),
    ).toEqual({ postId: POST, parentCommentId: null, body: 'Yes' })
    expect(
      createCommentSchema.safeParse({ postId: POST, parentCommentId: POST, body: 'Yes' }).success,
    ).toBe(true)
  })

  it('rejects an empty body and ids that are not uuids', () => {
    expect(
      createCommentSchema.safeParse({ postId: POST, parentCommentId: null, body: '  ' }).success,
    ).toBe(false)
    expect(
      createCommentSchema.safeParse({ postId: '../x', parentCommentId: null, body: 'a' }).success,
    ).toBe(false)
    expect(
      createCommentSchema.safeParse({ postId: POST, parentCommentId: 'x', body: 'a' }).success,
    ).toBe(false)
  })
})
