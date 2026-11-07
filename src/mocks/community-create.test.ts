import { describe, expect, it } from 'vitest'
import { createCommunity, updateCommunity } from './community-create'
import { DEMO_USER } from './demo-user'
import { communityBySlug } from './fixtures/communities'

const me = DEMO_USER.id
const create = (body: Record<string, unknown>) =>
  createCommunity({ userId: me, name: 'A group', ...body }, me)

describe('createCommunity (specs/community-create)', () => {
  it('creates a public group with its creator as principal moderator and first member', () => {
    const response = create({ slug: 'dividends-latam', description: 'Yield', rules: 'Be kind' })
    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({
      slug: 'dividends-latam',
      type: 'USER_PUBLIC',
      memberCount: 1,
      viewerMembership: 'PRINCIPAL_MODERATOR',
      createdByProfileId: me,
      description: 'Yield',
      rules: 'Be kind',
      mainUrl: null,
    })
    // Its page finds it afterwards.
    expect(communityBySlug('dividends-latam')?.name).toBe('A group')
  })

  it('refuses a taken slug with 409, a fixture or one just created', () => {
    expect(create({ slug: 'defi' }).status).toBe(409)
    expect(create({ slug: 'twice' }).status).toBe(201)
    expect(create({ slug: 'twice' })).toMatchObject({
      status: 409,
      body: { error: { code: 'SLUG_TAKEN' } },
    })
  })

  it('refuses a slug out of the backend format with 422 INVALID_SLUG', () => {
    for (const slug of ['Upper', 'with space', 'a'.repeat(51), 'acentuación']) {
      expect(create({ slug })).toMatchObject({
        status: 422,
        body: { error: { code: 'INVALID_SLUG' } },
      })
    }
  })

  it('asks for the slug and the name, and the caller as userId', () => {
    expect(create({ slug: '' }).status).toBe(400)
    expect(create({ slug: 'no-name', name: '' }).status).toBe(400)
    expect(createCommunity({ userId: 'someone', slug: 'x-group', name: 'X' }, me).status).toBe(403)
  })
})

describe('updateCommunity (specs/community-create)', () => {
  it('saves the images of a group the caller moderates', () => {
    create({ slug: 'with-images' })
    const response = updateCommunity(
      'with-images',
      { userId: me, avatarUrl: '/a.webp', bannerUrl: '/b.webp' },
      me,
    )
    expect(response).toMatchObject({
      status: 200,
      body: { avatarUrl: '/a.webp', bannerUrl: '/b.webp' },
    })
    expect(updateCommunity('with-images', { userId: me, bannerUrl: null }, me)).toMatchObject({
      body: { avatarUrl: '/a.webp', bannerUrl: null },
    })
  })

  it('edits what a moderator can, removes with null and ignores the slug (specs/community-edit CE-11)', () => {
    create({ slug: 'to-edit', description: 'Old' })
    const response = updateCommunity(
      'to-edit',
      { userId: me, name: 'Edited', description: null, rules: 'Be kind', slug: 'other' },
      me,
    )
    expect(response).toMatchObject({
      status: 200,
      body: { slug: 'to-edit', name: 'Edited', description: null, rules: 'Be kind' },
    })
  })

  it('refuses a field out of its limits with its name, and changes nothing (CE-11)', () => {
    create({ slug: 'to-refuse', description: 'Kept' })
    for (const [field, value] of [
      ['name', ''],
      ['name', null],
      ['description', 'a'.repeat(501)],
      ['rules', 'a'.repeat(2001)],
      ['mainUrl', 'a'.repeat(301)],
    ] as const) {
      expect(
        updateCommunity('to-refuse', { userId: me, description: 'Changed', [field]: value }, me),
      ).toMatchObject({ status: 422, body: { error: { code: 'VALIDATION_ERROR', field } } })
    }
    expect(communityBySlug('to-refuse')?.description).toBe('Kept')
  })

  it('refuses who does not moderate it, another userId and an unknown group', () => {
    expect(updateCommunity('defi', { userId: me, avatarUrl: '/a.webp' }, me)).toMatchObject({
      status: 403,
      body: { error: { code: 'NOT_MODERATOR' } },
    })
    expect(updateCommunity('trading-on-chain', { userId: 'someone' }, me).status).toBe(403)
    expect(updateCommunity('nope', { userId: me }, me).status).toBe(404)
    expect(updateCommunity('trading-on-chain', { userId: me, avatarUrl: 3 }, me).status).toBe(422)
  })
})
