// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { saveDraftSchema } from './save-draft.schema'

describe('saveDraftSchema (specs/drafts-tags DT-01)', () => {
  it('takes what is written, without requiring anything else, and leaves out the empty', () => {
    expect(saveDraftSchema.parse({ type: 'LINK', url: ' https://x.com ' })).toEqual({
      draftId: undefined,
      fields: {
        type: 'LINK',
        title: '',
        body: '',
        url: 'https://x.com',
        imageAlt: '',
        related: [],
      },
    })
  })

  it('keeps its related ones, up to 3 (specs/backend-answer-1020 BA-05)', () => {
    expect(
      saveDraftSchema.parse({ type: 'TEXT', title: 'a', related: ['#macro', '$BTC'] }).fields,
    ).toMatchObject({ related: ['#macro', '$BTC'] })
    expect(
      saveDraftSchema.safeParse({ type: 'TEXT', title: 'a', related: ['#a', '#b', '#c', '#d'] })
        .success,
    ).toBe(false)
  })

  it('needs something written', () => {
    expect(saveDraftSchema.safeParse({ type: 'TEXT', title: '  ' }).success).toBe(false)
    expect(saveDraftSchema.safeParse({ type: 'IMAGE', imageUrl: '/x.webp' }).success).toBe(true)
  })

  it('checks the draft id and the community', () => {
    expect(saveDraftSchema.safeParse({ type: 'TEXT', title: 'a', draftId: 'x' }).success).toBe(
      false,
    )
    expect(saveDraftSchema.safeParse({ type: 'TEXT', title: 'a', communityId: 'x' }).success).toBe(
      false,
    )
  })
})
