// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { createPostSchema, TITLE_MAX } from './create-post.schema'

const COMMUNITY = '00000000-0000-4000-8000-000000001001'
const valid = {
  communityId: COMMUNITY,
  type: 'TEXT',
  title: ' A title ',
  body: ' A body ',
  url: '',
}

function errors(input: unknown) {
  const result = createPostSchema.safeParse(input)
  return result.success
    ? {}
    : Object.fromEntries(result.error.issues.map((i) => [i.path[0], i.message]))
}

describe('createPostSchema (specs/post-create-detail PC-08, PC-09)', () => {
  it('trims a text post and leaves the url out', () => {
    expect(createPostSchema.parse(valid)).toEqual({
      communityId: COMMUNITY,
      type: 'TEXT',
      title: 'A title',
      body: 'A body',
    })
  })

  it('keeps the url of a link post, only http(s)', () => {
    expect(
      createPostSchema.parse({ ...valid, type: 'LINK', url: ' https://example.com/a ' }),
    ).toMatchObject({ url: 'https://example.com/a' })
    for (const url of [
      '',
      'example.com',
      'javascript:alert(1)',
      'data:text/html,x',
      'ftp://x.com',
    ]) {
      expect(errors({ ...valid, type: 'LINK', url }), url).toEqual({ url: 'composer.errors.url' })
    }
  })

  it('asks for a community, a title up to 300 characters and a body', () => {
    expect(errors({ ...valid, communityId: '' })).toEqual({
      communityId: 'composer.errors.community',
    })
    expect(errors({ ...valid, title: '   ' })).toEqual({ title: 'composer.errors.titleRequired' })
    expect(errors({ ...valid, title: 'x'.repeat(TITLE_MAX + 1) })).toEqual({
      title: 'composer.errors.titleTooLong',
    })
    expect(errors({ ...valid, title: 'x'.repeat(TITLE_MAX) })).toEqual({})
    expect(errors({ ...valid, body: '' })).toEqual({ body: 'composer.errors.bodyRequired' })
  })

  it('takes an Image post with its uploaded image, and leaves the url out (specs/post-image)', () => {
    const image = 'https://project.supabase.co/storage/v1/object/public/post-images/u/a.webp'
    expect(
      createPostSchema.parse({ ...valid, type: 'IMAGE', url: 'https://x.com', imageUrl: image }),
    ).toEqual({
      communityId: COMMUNITY,
      type: 'IMAGE',
      title: 'A title',
      body: 'A body',
      imageUrl: image,
    })
    expect(
      createPostSchema.safeParse({ ...valid, type: 'IMAGE', imageUrl: '/mocks/chart-btc.svg' })
        .success,
    ).toBe(true)
  })

  it('asks for the image of an Image post, and only an https one', () => {
    expect(errors({ ...valid, type: 'IMAGE' })).toEqual({
      imageUrl: 'composer.errors.imageRequired',
    })
    expect(errors({ ...valid, type: 'IMAGE', imageUrl: 'javascript:alert(1)' })).toEqual({
      imageUrl: 'composer.errors.imageRequired',
    })
  })

  it('leaves an image out of a Text post', () => {
    expect(
      createPostSchema.parse({ ...valid, imageUrl: 'https://x.com/a.webp' }),
    ).not.toHaveProperty('imageUrl')
  })
})
