// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { createCommentSchema } from './comment.schema'

const POST = '00000000-0000-4000-8000-000000004001'

describe('createCommentSchema', () => {
  it('takes a thesis only with its side (specs/thesis-arguments TA-04)', () => {
    const thesis = { kind: 'thesis', id: POST }
    expect(
      createCommentSchema.safeParse({ target: thesis, parentCommentId: null, body: 'a' }).success,
    ).toBe(false)
    expect(
      createCommentSchema.safeParse({
        target: { ...thesis, side: 'MAYBE' },
        parentCommentId: null,
        body: 'a',
      }).success,
    ).toBe(false)
    expect(
      createCommentSchema.parse({
        target: { ...thesis, side: 'CONTRA' },
        parentCommentId: null,
        body: 'No',
      }).target,
    ).toEqual({ kind: 'thesis', id: POST, side: 'CONTRA' })
  })

  it('accepts a comment and a reply, trimmed', () => {
    expect(
      createCommentSchema.parse({
        target: { kind: 'post', id: POST },
        parentCommentId: null,
        body: ' Yes ',
      }),
    ).toEqual({ target: { kind: 'post', id: POST }, parentCommentId: null, body: 'Yes' })
    expect(
      createCommentSchema.safeParse({
        target: { kind: 'post', id: POST },
        parentCommentId: POST,
        body: 'Yes',
      }).success,
    ).toBe(true)
  })

  it('rejects an empty body and ids that are not uuids', () => {
    expect(
      createCommentSchema.safeParse({
        target: { kind: 'post', id: POST },
        parentCommentId: null,
        body: '  ',
      }).success,
    ).toBe(false)
    expect(
      createCommentSchema.safeParse({
        target: { kind: 'post', id: '../x' },
        parentCommentId: null,
        body: 'a',
      }).success,
    ).toBe(false)
    expect(
      createCommentSchema.safeParse({
        target: { kind: 'post', id: POST },
        parentCommentId: 'x',
        body: 'a',
      }).success,
    ).toBe(false)
  })
})
