// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { DEMO_USER } from './demo-user'
import { addFeatured, FEATURED_MAX, listFeatured, removeFeatured } from './featured'
import { mockId } from './fixtures/ids'
import { PROFILES } from './fixtures/users'
import { createPost, DEMO_POST_ID } from './posting'
import { communityBySlug } from './fixtures/communities'

const me = DEMO_USER.id
const maria = PROFILES.find((profile) => profile.username === 'maria')!.id
const kinds = (userId: string) =>
  (listFeatured(userId).body as { items: Array<{ kind: string }> }).items.map((item) => item.kind)
const add = (id: string) => addFeatured(me, { userId: me, kind: 'post', id })

describe('featured mock (P-025, specs/profile-showcase)', () => {
  it("lists someone's featured, a thesis and a post, the last featured first", () => {
    expect(kinds(maria)).toEqual(['thesis', 'post'])
  })

  it('features your own content, once, and takes it out', () => {
    expect(add(DEMO_POST_ID)).toMatchObject({ status: 201 })
    expect(add(DEMO_POST_ID)).toMatchObject({ status: 200 })
    expect(kinds(me)).toEqual(['post'])
    expect(removeFeatured(me, 'post', DEMO_POST_ID, me)).toEqual({ status: 204 })
    expect(kinds(me)).toEqual([])
  })

  it(`refuses past ${FEATURED_MAX}, someone else's content, and another user`, () => {
    const posts = Array.from(
      { length: FEATURED_MAX + 1 },
      (_, n) =>
        (
          createPost({
            userId: me,
            communityId: communityBySlug('defi')!.id,
            type: 'TEXT',
            title: `Post ${n}`,
            body: 'Body',
          }).body as { id: string }
        ).id,
    )
    for (const id of posts.slice(0, FEATURED_MAX)) expect(add(id)).toMatchObject({ status: 201 })
    expect(add(posts[FEATURED_MAX]!)).toMatchObject({
      status: 409,
      body: { error: { code: 'FEATURED_LIMIT' } },
    })
    for (const id of posts) removeFeatured(me, 'post', id, me)

    expect(add(mockId(4, 1))).toMatchObject({ status: 403, body: { error: { code: 'NOT_OWNER' } } })
    expect(add(mockId(4, 999))).toMatchObject({ status: 404 })
    expect(addFeatured(maria, { userId: maria, kind: 'post', id: mockId(4, 1) })).toMatchObject({
      status: 403,
      body: { error: { code: 'USER_MISMATCH' } },
    })
    expect(removeFeatured(me, 'post', DEMO_POST_ID, 'someone')).toMatchObject({ status: 403 })
  })
})
