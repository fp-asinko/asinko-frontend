// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { DEMO_USER } from './demo-user'
import { createDraft, deleteDraft, DRAFTS_MAX, listDrafts, updateDraft } from './drafts'
import { communityBySlug } from './fixtures/communities'
import { createPost } from './posting'

const me = DEMO_USER.id
const ids = () =>
  (listDrafts(me).body as { items: Array<{ id: string; title: string }> }).items.map((d) => d.id)

describe('drafts mock (P-022, specs/drafts-tags)', () => {
  it('saves, updates to the top, deletes, and answers only the viewer', () => {
    const made = createDraft({ userId: me, type: 'TEXT', title: 'One' })
    expect(made.status).toBe(201)
    const id = (made.body as { id: string }).id
    expect(ids()[0]).toBe(id)

    expect(updateDraft(id, { userId: me, type: 'TEXT', title: 'Two' })).toMatchObject({
      status: 200,
      body: { title: 'Two' },
    })
    expect(deleteDraft(id, me)).toEqual({ status: 204 })
    expect(ids()).not.toContain(id)

    expect(listDrafts('someone')).toMatchObject({ status: 403 })
    expect(updateDraft(id, { userId: me })).toMatchObject({ status: 404 })
  })

  it(`refuses a draft past ${DRAFTS_MAX}`, () => {
    const made: string[] = []
    while (ids().length < DRAFTS_MAX) {
      made.push((createDraft({ userId: me, title: 'Filler' }).body as { id: string }).id)
    }
    expect(createDraft({ userId: me, title: 'One too many' })).toMatchObject({
      status: 409,
      body: { error: { code: 'DRAFT_LIMIT' } },
    })
    for (const id of made) deleteDraft(id, me)
  })
})

describe('tags on publishing (P-023, specs/drafts-tags)', () => {
  const post = (slug: string, tag: string) =>
    createPost({
      userId: me,
      communityId: communityBySlug(slug)!.id,
      type: 'TEXT',
      title: 'Rates',
      body: 'Up.',
      tag,
    })

  it("takes one of the community's tags, and refuses another", () => {
    expect(post('defi', 'Analysis')).toMatchObject({ status: 201, body: { tag: 'Analysis' } })
    expect(post('defi', 'Memes')).toMatchObject({
      status: 422,
      body: { error: { code: 'INVALID_TAG' } },
    })
    // A group without tags takes none.
    expect(post('latam', 'Analysis')).toMatchObject({ status: 422 })
  })
})
