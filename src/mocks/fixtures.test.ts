import { describe, expect, it } from 'vitest'
import {
  assetSchema,
  commentSchema,
  communitySchema,
  pollSchema,
  postSchema,
  profileSchema,
  type RawComment,
} from '@/lib/api/contract'
import { ASSETS } from './fixtures/assets'
import { COMMENTS_BY_CONTENT } from './fixtures/comments'
import { COMMUNITIES } from './fixtures/communities'
import { POLLS } from './fixtures/polls'
import { POSTS } from './fixtures/posts'
import { PROFILES } from './fixtures/users'
import { MOCK_ROUTES } from './handlers'

// F-37: mocks respect the contract. A fixture or handler output that breaks its schema fails here.
describe('mock fixtures match the contract schemas', () => {
  it.each([
    ['profiles', PROFILES, profileSchema],
    ['communities', COMMUNITIES, communitySchema],
    ['assets', ASSETS, assetSchema],
    ['posts', POSTS, postSchema],
    ['polls', POLLS, pollSchema],
    ['comments', Object.values(COMMENTS_BY_CONTENT).flat(), commentSchema],
  ] as const)('%s', (_name, records, schema) => {
    for (const record of records) {
      const parsed = schema.safeParse(record)
      expect(parsed.success, JSON.stringify(parsed.error?.issues)).toBe(true)
    }
  })

  it.each(MOCK_ROUTES.map((route) => [`${route.method} ${route.path}`, route] as const))(
    '%s returns a body that matches its schema',
    async (_name, route) => {
      const { status, body } = await route.handler(route.example)
      expect(status).toBeGreaterThanOrEqual(200)
      expect(status).toBeLessThan(300)
      const parsed = route.schema.safeParse(body)
      expect(parsed.success, JSON.stringify(parsed.error?.issues)).toBe(true)
    },
  )
})

describe('mock data is internally consistent', () => {
  function flatten(comments: RawComment[]): RawComment[] {
    return comments.flatMap((comment) => [comment, ...flatten(comment.replies)])
  }

  it('has unique ids across every collection', () => {
    const ids = [
      ...PROFILES,
      ...COMMUNITIES,
      ...ASSETS,
      ...POSTS,
      ...POLLS,
      ...flatten(Object.values(COMMENTS_BY_CONTENT).flat()),
    ].map((record) => record.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('resolves every mention to the exact text it covers', () => {
    for (const post of POSTS) {
      for (const entity of post.entities ?? []) {
        const [start, end] = entity.position
        expect(post.body.slice(start, end)).toBe(entity.raw)
      }
    }
  })

  it('includes the three mention types somewhere', () => {
    const types = new Set(POSTS.flatMap((post) => post.entities ?? []).map((e) => e.type))
    expect(types).toEqual(new Set(['TICKER', 'COMMUNITY', 'MENTION']))
  })

  it('keeps each commentCount equal to its comments, without deleted ones (as the backend)', () => {
    for (const content of [...POSTS, ...POLLS]) {
      const alive = flatten(COMMENTS_BY_CONTENT[content.id] ?? []).filter((each) => !each.deleted)
      expect(alive.length, content.id).toBe(content.commentCount)
    }
  })

  it('carries the community summary of each piece of content (P-004)', () => {
    for (const content of [...POSTS, ...POLLS]) {
      const community = COMMUNITIES.find((each) => each.id === content.communityId)
      expect(content.community).toEqual({
        id: community?.id,
        slug: community?.slug,
        name: community?.name,
        type: community?.type,
      })
    }
  })

  it('sends an empty body for deleted posts and comments (P-008)', () => {
    const comments = flatten(Object.values(COMMENTS_BY_CONTENT).flat())
    for (const deleted of [...POSTS, ...comments].filter((each) => each.deleted)) {
      expect(deleted.body).toBe('')
    }
  })

  it('wires replies to their parent and replyCount to the replies', () => {
    for (const comment of flatten(Object.values(COMMENTS_BY_CONTENT).flat())) {
      expect(comment.replyCount).toBe(comment.replies.length)
      for (const reply of comment.replies) expect(reply.parentCommentId).toBe(comment.id)
    }
  })
})
