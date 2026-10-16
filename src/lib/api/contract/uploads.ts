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

/**
 * POST /api/v1/uploads/avatar and /uploads/profile-banner (P-021, proposal, specs/profile-presentation):
 * the same signed URL as a post image; `imageUrl` is what PATCH /users takes.
 */
export const profileImageUploadSchema = postImageUploadSchema

export type RawPostImageUpload = z.infer<typeof postImageUploadSchema>
