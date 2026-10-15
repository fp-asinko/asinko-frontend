import type { RawComment, RawPost } from '@/lib/api/contract'
import { DEMO_USER } from './demo-user'
import { COMMENTS_BY_CONTENT } from './fixtures/comments'
import { communityById, communitySummary } from './fixtures/communities'
import { mockId } from './fixtures/ids'
import { postById } from './fixtures/posts'
import { summary } from './fixtures/users'
import type { MockResponse } from './types'
import { MOCK_POST_IMAGE } from './post-image'

// Creating posts and comments, and voting comments (E03, E05), for the demo viewer
// (specs/post-create-detail § 6). Validates as the backend does. Created posts and comments live
// in this process's memory, so an e2e can publish and then see them; votes are not stored.

const TITLE_MAX = 300
const error = (status: number, code: string): MockResponse => ({
  status,
  body: { error: { code, message: 'mock' } },
})

/** Posts created in this process (newest first). */
export const CREATED_POSTS: RawPost[] = []
let created = 0

export function findPost(id: string): RawPost | undefined {
  return CREATED_POSTS.find((each) => each.id === id) ?? postById(id)
}

export function createPost(body: unknown): MockResponse {
  const input = (body ?? {}) as Record<string, unknown>
  if (input.userId !== DEMO_USER.id) return error(403, 'USER_MISMATCH')
  const community = typeof input.communityId === 'string' ? communityById(input.communityId) : null
  if (!community) return error(422, 'INVALID_COMMUNITY')
  if (community.type === 'PERSONAL_CHANNEL' && community.slug !== DEMO_USER.username) {
    return error(403, 'PERSONAL_CHANNEL_OWNER_ONLY')
  }
  const type = input.type
  if (type !== 'TEXT' && type !== 'LINK' && type !== 'IMAGE') return error(422, 'VALIDATION_ERROR')
  const title = typeof input.title === 'string' ? input.title : ''
  if (!title.trim() || title.length > TITLE_MAX) return error(422, 'VALIDATION_ERROR')
  if (typeof input.body !== 'string' || !input.body.trim()) return error(422, 'VALIDATION_ERROR')
  if (input.url !== undefined && type !== 'LINK') return error(422, 'VALIDATION_ERROR')
  // As the backend: an image only with IMAGE, and only one of its bucket (here, the fixture the
  // mocked upload answers, specs/post-image).
  if (input.imageUrl !== undefined && type !== 'IMAGE') return error(422, 'VALIDATION_ERROR')
  if (type === 'IMAGE' && input.imageUrl !== MOCK_POST_IMAGE) return error(422, 'VALIDATION_ERROR')
  // imageAlt: only with an image, up to 300 (P-013).
  if (input.imageAlt !== undefined && type !== 'IMAGE') return error(422, 'VALIDATION_ERROR')
  const imageAlt =
    typeof input.imageAlt === 'string' && input.imageAlt.trim() ? input.imageAlt.trim() : null
  if (imageAlt && imageAlt.length > 300) return error(422, 'VALIDATION_ERROR')

  created += 1
  const now = new Date().toISOString()
  const post: RawPost = {
    id: mockId(9, created),
    communityId: community.id,
    community: communitySummary(community.slug),
    type,
    title,
    body: input.body,
    url: type === 'LINK' && typeof input.url === 'string' ? input.url : null,
    imageUrl: type === 'IMAGE' ? MOCK_POST_IMAGE : null,
    imageAlt: type === 'IMAGE' ? imageAlt : null,
    tag: null,
    creator: summary(DEMO_USER.username),
    creatorType: 'USER',
    score: 0,
    commentCount: 0,
    viewerVote: null,
    editedAt: null,
    deleted: false,
    createdAt: now,
    publishedAt: now,
    entities: [],
  }
  CREATED_POSTS.unshift(post)
  return { status: 201, body: post }
}

/** Comments created in this process, flat, by content id (oldest first). */
const CREATED_COMMENTS: Record<string, RawComment[]> = {}

function withCreated(
  list: readonly RawComment[],
  parentId: string | null,
  created: readonly RawComment[],
): RawComment[] {
  return [...list, ...created.filter((each) => each.parentCommentId === parentId)].map((each) => {
    const replies = withCreated(each.replies, each.id, created)
    return { ...each, replies, replyCount: replies.length }
  })
}

/** The whole thread of a content, with the comments created here at the end of their level. */
export function commentsOf(contentId: string): RawComment[] {
  return withCreated(COMMENTS_BY_CONTENT[contentId] ?? [], null, CREATED_COMMENTS[contentId] ?? [])
}

function allComments(): RawComment[] {
  const flat: RawComment[] = []
  const walk = (list: readonly RawComment[]) =>
    list.forEach((each) => {
      flat.push(each)
      walk(each.replies)
    })
  Object.values(COMMENTS_BY_CONTENT).forEach(walk)
  Object.values(CREATED_COMMENTS).forEach(walk)
  return flat
}

export function createComment(contentId: string, body: unknown): MockResponse {
  if (!findPost(contentId)) return error(404, 'NOT_FOUND')
  const input = (body ?? {}) as Record<string, unknown>
  if (input.userId !== DEMO_USER.id) return error(403, 'USER_MISMATCH')
  if (typeof input.body !== 'string' || !input.body.trim()) return error(422, 'VALIDATION_ERROR')
  const parentId = input.parentCommentId ?? null
  if (parentId !== null) {
    const thread = commentsOf(contentId)
    const inThread = (list: readonly RawComment[]): boolean =>
      list.some((each) => each.id === parentId || inThread(each.replies))
    if (typeof parentId !== 'string' || !inThread(thread)) return error(422, 'VALIDATION_ERROR')
  }
  created += 1
  const comment: RawComment = {
    id: mockId(10, created),
    author: summary(DEMO_USER.username),
    body: input.body,
    parentCommentId: parentId as string | null,
    side: null,
    score: 0,
    viewerVote: null,
    replyCount: 0,
    editedAt: null,
    deleted: false,
    createdAt: new Date().toISOString(),
    replies: [],
  }
  ;(CREATED_COMMENTS[contentId] ??= []).push(comment)
  return { status: 201, body: comment }
}

export function voteComment(commentId: string, body: unknown): MockResponse {
  const comment = allComments().find((each) => each.id === commentId)
  if (!comment || comment.deleted) return error(404, 'NOT_FOUND')
  const { userId, value } = (body ?? {}) as { userId?: unknown; value?: unknown }
  if (userId !== DEMO_USER.id) return error(403, 'USER_MISMATCH')
  if (value !== 1 && value !== -1) return error(422, 'INVALID')
  const score = comment.score - (comment.viewerVote ?? 0) + value
  return { status: 200, body: { score, viewerVote: value } }
}

export function removeCommentVote(commentId: string, userId: string | undefined): MockResponse {
  if (!allComments().some((each) => each.id === commentId)) return error(404, 'NOT_FOUND')
  if (userId !== DEMO_USER.id) return error(403, 'USER_MISMATCH')
  return { status: 204 }
}
