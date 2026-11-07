// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { editGroupChangesSchema } from './create-group.schema'

describe('editGroupChangesSchema (specs/community-edit CE-02, CE-05)', () => {
  it('takes only what changed, and an empty text removes it', () => {
    expect(editGroupChangesSchema.parse({ description: '  ', rules: 'Be kind' })).toEqual({
      description: null,
      rules: 'Be kind',
    })
    expect(editGroupChangesSchema.parse({ mainUrl: '' })).toEqual({ mainUrl: null })
    expect(editGroupChangesSchema.parse({})).toEqual({})
  })

  it('keeps the limits of a new group, and never a handle', () => {
    expect(editGroupChangesSchema.safeParse({ name: 'ab' }).success).toBe(false)
    expect(editGroupChangesSchema.safeParse({ description: 'a'.repeat(501) }).success).toBe(false)
    expect(editGroupChangesSchema.safeParse({ mainUrl: 'javascript:alert(1)' }).success).toBe(false)
    expect(editGroupChangesSchema.parse({ slug: 'other' })).toEqual({})
  })

  it('removes the photo or banner with null, and takes no URL for them', () => {
    expect(editGroupChangesSchema.parse({ avatarUrl: null })).toEqual({ avatarUrl: null })
    expect(editGroupChangesSchema.safeParse({ bannerUrl: 'https://x.test/b.png' }).success).toBe(
      false,
    )
  })
})
