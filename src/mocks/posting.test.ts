// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { DEMO_USER } from './demo-user'
import { communityBySlug } from './fixtures/communities'
import { pollById } from './fixtures/polls'
import { postById } from './fixtures/posts'
import { thesisById } from './fixtures/theses'
import { commentsOf, createPost } from './posting'

describe('posting mock', () => {
  it("gives a created post an id no fixture has, so it starts without comments (ES-02's flake)", () => {
    // The fixtures' theses go up to a few dozen: enough posts to have crossed all of them.
    for (let n = 0; n < 60; n += 1) {
      const { id } = createPost({
        userId: DEMO_USER.id,
        communityId: communityBySlug('defi')!.id,
        type: 'TEXT',
        title: `Post ${n}`,
        body: 'Body',
      }).body as { id: string }
      expect(thesisById(id) ?? postById(id) ?? pollById(id)).toBeUndefined()
      expect(commentsOf(id)).toEqual([])
    }
  })
})
