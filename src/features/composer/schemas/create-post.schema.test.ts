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

  it('accepts only Text and Link (Image waits for uploads)', () => {
    expect(createPostSchema.safeParse({ ...valid, type: 'IMAGE' }).success).toBe(false)
  })
})
