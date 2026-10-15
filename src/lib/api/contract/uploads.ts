import { z } from 'zod'

/**
 * POST /api/v1/uploads/post-image (P-013, backend 2026-10-13): where to put one post image. The
 * upload URL is signed and good for one PUT; `imageUrl` is what POST /posts takes (the published
 * post brings back its own, without EXIF).
 */
export const postImageUploadSchema = z.object({
  uploadUrl: z.string(),
  imageUrl: z.string(),
  path: z.string(),
})

export type RawPostImageUpload = z.infer<typeof postImageUploadSchema>
