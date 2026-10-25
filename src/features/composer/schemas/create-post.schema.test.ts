// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  createPostSchema,
  IMAGE_ALT_MAX,
  RELATED_MAX,
  TAG_MAX,
  THOUGHT_MAX,
  TITLE_MAX,
} from './create-post.schema'

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
      related: [],
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

  it('asks for a community and a title up to 300 characters; the body is optional (TH-01)', () => {
    expect(errors({ ...valid, communityId: '' })).toEqual({
      communityId: 'composer.errors.community',
    })
    expect(errors({ ...valid, title: '   ' })).toEqual({ title: 'composer.errors.titleRequired' })
    expect(errors({ ...valid, title: 'x'.repeat(TITLE_MAX + 1) })).toEqual({
      title: 'composer.errors.titleTooLong',
    })
    expect(errors({ ...valid, title: 'x'.repeat(TITLE_MAX) })).toEqual({})
    expect(errors({ ...valid, body: '' })).toEqual({})
  })

  it('takes a thought with only its text, and never sends a title (specs/thoughts TH-03)', () => {
    expect(errors({ ...valid, type: 'THOUGHT', title: '', body: '' })).toEqual({
      body: 'composer.errors.thoughtRequired',
    })
    // Brief: up to 250 characters, as the prototype's (ours: the backend has no limit).
    expect(errors({ ...valid, type: 'THOUGHT', body: 'x'.repeat(THOUGHT_MAX) })).toEqual({})
    expect(errors({ ...valid, type: 'THOUGHT', body: 'x'.repeat(THOUGHT_MAX + 1) })).toEqual({
      body: 'composer.errors.thoughtTooLong',
    })
    // A title typed before choosing Thought is left out, not refused.
    expect(
      createPostSchema.parse({ ...valid, type: 'THOUGHT', title: 'Typed before' }),
    ).toMatchObject({
      type: 'THOUGHT',
      title: '',
      body: 'A body',
    })
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
      related: [],
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

  it('sends the image description only with an image, trimmed, up to 300 (BA-04)', () => {
    const image = { ...valid, type: 'IMAGE', imageUrl: '/mocks/chart-btc.svg' }
    expect(createPostSchema.parse({ ...image, imageAlt: '  BTC since 2020 ' })).toMatchObject({
      imageAlt: 'BTC since 2020',
    })
    // Not written: not sent.
    expect(createPostSchema.parse({ ...image, imageAlt: '  ' })).not.toHaveProperty('imageAlt')
    expect(createPostSchema.parse({ ...valid, imageAlt: 'A chart' })).not.toHaveProperty('imageAlt')
    expect(errors({ ...image, imageAlt: 'a'.repeat(IMAGE_ALT_MAX + 1) })).toEqual({
      imageAlt: 'composer.errors.imageAltTooLong',
    })
  })
})

describe('createPostSchema related (specs/related-tags RT-02, RT-04)', () => {
  it('keeps the related ones apart, never on a last line of the body (specs/backend-answer-1020 BA-06)', () => {
    expect(
      createPostSchema.parse({ ...valid, related: ['$GGAL', '#macro', '$BRK.B'] }),
    ).toMatchObject({ body: 'A body', related: ['$GGAL', '#macro', '$BRK.B'] })
    expect(createPostSchema.parse(valid)).toMatchObject({ body: 'A body', related: [] })
  })

  it(`takes up to ${RELATED_MAX}, mentions only, without repeats`, () => {
    const four = ['#a', '#b', '#c', '#d']
    expect(errors({ ...valid, related: four })).toHaveProperty('related')
    expect(errors({ ...valid, related: ['macro'] })).toHaveProperty('related')
    expect(errors({ ...valid, related: ['@maria'] })).toHaveProperty('related')
    expect(errors({ ...valid, related: ['#macro x'] })).toHaveProperty('related')
    expect(errors({ ...valid, related: ['#macro', '#macro'] })).toHaveProperty('related')
  })
})

describe('createPostSchema tag (specs/drafts-tags DT-09)', () => {
  it('sends one tag when chosen, and none when empty', () => {
    expect(createPostSchema.parse({ ...valid, tag: ' News ' })).toMatchObject({ tag: 'News' })
    expect(createPostSchema.parse({ ...valid, tag: '' })).not.toHaveProperty('tag')
    expect(createPostSchema.parse(valid)).not.toHaveProperty('tag')
    expect(createPostSchema.safeParse({ ...valid, tag: 'x'.repeat(TAG_MAX + 1) }).success).toBe(
      false,
    )
  })
})
