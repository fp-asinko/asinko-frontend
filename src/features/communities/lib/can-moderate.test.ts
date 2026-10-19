// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { canModerate } from './can-moderate'

describe('canModerate (specs/community-widgets CW-08)', () => {
  it('a moderator or the principal one, not a member nor someone outside', () => {
    expect(canModerate({ viewerMembership: 'MODERATOR' })).toBe(true)
    expect(canModerate({ viewerMembership: 'PRINCIPAL_MODERATOR' })).toBe(true)
    expect(canModerate({ viewerMembership: 'MEMBER' })).toBe(false)
    expect(canModerate({ viewerMembership: null })).toBe(false)
  })
})
