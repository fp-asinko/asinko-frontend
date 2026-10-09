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
 * Link post and the imageUrl with an Image one (specs/post-image): the backend rejects them on any
 * other type, and checks that the image is a file of its bucket.
 */
export const createPostSchema = z
  .object({
    communityId: z.uuid({ message: 'composer.errors.community' }),
    type: z.enum(['TEXT', 'LINK', 'IMAGE']),
    title: z
      .string()
      .trim()
      .min(1, { message: 'composer.errors.titleRequired' })
      .max(TITLE_MAX, { message: 'composer.errors.titleTooLong' }),
    body: z.string().trim().min(1, { message: 'composer.errors.bodyRequired' }),
    url: z.string().trim().optional(),
    imageUrl: z.string().trim().optional(),
  })
  .superRefine((post, ctx) => {
    if (post.type === 'LINK' && !(post.url && isHttpUrl(post.url))) {
      ctx.addIssue({ code: 'custom', path: ['url'], message: 'composer.errors.url' })
    }
    // The uploaded image: an https URL of Storage, or the mocks' own path.
    const image = post.imageUrl ?? ''
    if (post.type === 'IMAGE' && !(isHttpUrl(image) || image.startsWith('/mocks/'))) {
      ctx.addIssue({ code: 'custom', path: ['imageUrl'], message: 'composer.errors.imageRequired' })
    }
  })
  .transform(({ url, imageUrl, ...post }) =>
    post.type === 'LINK' ? { ...post, url } : post.type === 'IMAGE' ? { ...post, imageUrl } : post,
  )

/** What the form holds (strings, url always present). */
export type CreatePostForm = z.input<typeof createPostSchema>
/** What reaches the backend. */
export type CreatePostInput = z.output<typeof createPostSchema>
