// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { COMMUNITIES } from './fixtures/communities'
import { MOCK_NOW } from './fixtures/ids'
import { POSTS } from './fixtures/posts'
import { topPostOf } from './top-post'

const WEEK = 7 * 24 * 60 * 60_000

describe('topPostOf (P-016, specs/interests-refresh IR-01)', () => {
  it('picks the most voted post of the last 7 days, or else the newest, never a deleted one', () => {
    for (const community of COMMUNITIES) {
      const posts = POSTS.filter((post) => post.communityId === community.id && !post.deleted)
      const top = topPostOf(community.id)
      if (posts.length === 0) {
        expect(top).toBeNull()
        continue
      }
      const recent = posts.filter((post) => MOCK_NOW - Date.parse(post.createdAt) <= WEEK)
      const pool = recent.length ? recent : posts
      const chosen = posts.find((post) => post.id === top!.id)!
      expect(chosen.title).toBe(top!.title)
      if (recent.length) {
        expect(chosen.score).toBe(Math.max(...recent.map((post) => post.score)))
      } else {
        expect(chosen.createdAt).toBe(
          pool
            .map((post) => post.createdAt)
            .sort()
            .at(-1),
        )
      }
    }
  })

  it('gives some community a main post in the mocks', () => {
    expect(COMMUNITIES.some((community) => topPostOf(community.id) !== null)).toBe(true)
  })
})
