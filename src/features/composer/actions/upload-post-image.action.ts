'use server'

import type { ActionResult } from '@/lib/result'
import { MAX_UPLOAD_BYTES } from '@/lib/prepare-image'
import { getViewer } from '@/lib/session'
import { uploadPostImage } from '../lib/post-image-upload'

/**
 * What the bytes say they are: the type the browser sends is not trusted (security.md § 6). Only
 * what prepareImage gives: WebP, or JPEG where the browser cannot write WebP.
 */
function sniff(head: Uint8Array): 'image/webp' | 'image/jpeg' | null {
  const ascii = (from: number, to: number) => String.fromCharCode(...head.subarray(from, to))
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp'
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return 'image/jpeg'
  return null
}

/**
 * Uploads a post's image (specs/post-image PI-06, PI-07) through the backend's signed URL
 * (specs/backend-answer-1013 BA-01). A public endpoint: checks the session itself, the size and the
 * bytes before asking the backend.
 */
export async function uploadPostImageAction(
  form: FormData,
): Promise<ActionResult<{ imageUrl: string }>> {
  const viewer = await getViewer()
  if (!viewer) return { ok: false, error: 'api.errors.UNAUTHENTICATED' }

  const file = form.get('file')
  if (!(file instanceof Blob) || file.size === 0) {
    return { ok: false, error: 'composer.errors.imageType' }
  }
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: 'composer.errors.imageTooLarge' }
  const contentType = sniff(new Uint8Array(await file.slice(0, 12).arrayBuffer()))
  if (!contentType) return { ok: false, error: 'composer.errors.imageType' }

  const result = await uploadPostImage({ userId: viewer.id, body: file, contentType })
  if (result.ok) return result
  const errors = {
    type: 'composer.errors.imageType',
    unauthenticated: 'api.errors.UNAUTHENTICATED',
    upload: 'composer.errors.imageUpload',
  } as const
  return { ok: false, error: errors[result.error] }
}
