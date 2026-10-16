import 'server-only'
import {
  uploadSignedImage,
  type UploadDeps,
  type UploadResult,
} from '@/lib/uploads/signed-image-upload'

export type { UploadResult }

/**
 * Uploads a post image the backend's way (P-013, specs/backend-answer-1013 BA-01, Q1): a signed URL
 * the server PUTs to itself (lib/uploads/signed-image-upload.ts).
 */
export function uploadPostImage(
  input: { userId: string; body: Blob; contentType: string },
  deps?: UploadDeps,
): Promise<UploadResult> {
  return uploadSignedImage('/api/v1/uploads/post-image', input, deps)
}
