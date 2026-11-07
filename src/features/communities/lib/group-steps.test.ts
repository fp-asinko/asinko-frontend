// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { groupSteps } from './group-steps'

type Group = Record<'avatarUrl' | 'bannerUrl' | 'description' | 'rules', string | null>
const empty: Group = { avatarUrl: null, bannerUrl: null, description: null, rules: null }
const done = (page: Partial<Group>, hasPosts = false) =>
  groupSteps({ ...empty, ...page }, hasPosts)
    .filter((step) => step.done)
    .map((step) => step.id)

describe('groupSteps (specs/community-edit CE-07)', () => {
  it('lists the four steps in order, none done for a new group', () => {
    expect(groupSteps(empty, false).map((step) => step.id)).toEqual([
      'images',
      'description',
      'rules',
      'post',
    ])
    expect(done({})).toEqual([])
  })

  it('counts the images with a photo or a banner, and each other step by itself', () => {
    expect(done({ bannerUrl: '/b.webp' })).toEqual(['images'])
    expect(done({ avatarUrl: '/a.webp', rules: 'Be kind' })).toEqual(['images', 'rules'])
    expect(done({ description: 'About it' }, true)).toEqual(['description', 'post'])
  })
})
