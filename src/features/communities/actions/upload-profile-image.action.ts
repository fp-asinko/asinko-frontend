'use server'

import { z } from 'zod'
import type { ActionResult } from '@/lib/result'
import { MAX_UPLOAD_BYTES } from '@/lib/prepare-image'
import { getViewer } from '@/lib/session'
import { uploadSignedImage } from '@/lib/uploads/signed-image-upload'
import { sniffImage } from '@/lib/uploads/sniff-image'

const PATHS = {
  avatar: '/api/v1/uploads/avatar',
  banner: '/api/v1/uploads/profile-banner',
} as const

const kindSchema = z.enum(['avatar', 'banner'])

/**
 * Uploads your profile's photo or banner, already cropped and prepared in the browser
 * (specs/profile-presentation PP-07), through the backend's signed URL (P-021). A public endpoint:
 * checks the session itself, the size and the bytes before asking the backend. Answers the image's
 * URL, which Save then sends as avatarUrl or bannerUrl.
 */
export async function uploadProfileImage(
  form: FormData,
): Promise<ActionResult<{ imageUrl: string }>> {
  const viewer = await getViewer()
  if (!viewer) return { ok: false, error: 'api.errors.UNAUTHENTICATED' }

  const kind = kindSchema.safeParse(form.get('kind'))
  const file = form.get('file')
  if (!kind.success || !(file instanceof Blob) || file.size === 0) {
    return { ok: false, error: 'communities.edit.errors.imageType' }
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: 'communities.edit.errors.imageTooLarge' }
  }
  const contentType = sniffImage(new Uint8Array(await file.slice(0, 12).arrayBuffer()))
  if (!contentType) return { ok: false, error: 'communities.edit.errors.imageType' }

  const result = await uploadSignedImage(PATHS[kind.data], {
    userId: viewer.id,
    body: file,
    contentType,
  })
  if (result.ok) return result
  const errors = {
    type: 'communities.edit.errors.imageType',
    unauthenticated: 'api.errors.UNAUTHENTICATED',
    upload: 'communities.edit.errors.imageUpload',
  } as const
  return { ok: false, error: errors[result.error] }
}
