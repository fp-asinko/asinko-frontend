import { z } from 'zod'

/** The backend's limit for a title (POST /posts, E03). */
export const TITLE_MAX = 300

/** Only http(s) links (security.md § 1): javascript:, data: and the rest are rejected. */
function isHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * A new post (specs/post-create-detail PC-08, PC-09): the same schema helps in the editor and
 * decides in the Server Action. Messages are translation keys (i18n.md). The url only goes with a
 * Link post: the backend rejects it on any other type.
 */
export const createPostSchema = z
  .object({
    communityId: z.uuid({ message: 'composer.errors.community' }),
    type: z.enum(['TEXT', 'LINK']),
    title: z
      .string()
      .trim()
      .min(1, { message: 'composer.errors.titleRequired' })
      .max(TITLE_MAX, { message: 'composer.errors.titleTooLong' }),
    body: z.string().trim().min(1, { message: 'composer.errors.bodyRequired' }),
    url: z.string().trim().optional(),
  })
  .superRefine((post, ctx) => {
    if (post.type === 'LINK' && !(post.url && isHttpUrl(post.url))) {
      ctx.addIssue({ code: 'custom', path: ['url'], message: 'composer.errors.url' })
    }
  })
  .transform(({ url, ...post }) => (post.type === 'LINK' ? { ...post, url } : post))

/** What the form holds (strings, url always present). */
export type CreatePostForm = z.input<typeof createPostSchema>
/** What reaches the backend. */
export type CreatePostInput = z.output<typeof createPostSchema>
