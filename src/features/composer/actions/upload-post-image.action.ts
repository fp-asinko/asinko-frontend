'use server'

import { z } from 'zod'
import type { ActionResult } from '@/lib/result'
import { MAX_UPLOAD_BYTES } from '@/lib/prepare-image'
import { getAccessToken, getViewer } from '@/lib/session'
import { removePostImage, uploadPostImage } from '@/lib/storage/post-images'

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
 * Uploads a post's image (specs/post-image PI-06, PI-07). A public endpoint: checks the session
 * itself, the size and the bytes, and uploads into the viewer's own folder.
 */
export async function uploadPostImageAction(
  form: FormData,
): Promise<ActionResult<{ imageUrl: string }>> {
  const viewer = await getViewer()
  if (!viewer) return { ok: false, error: 'api.errors.UNAUTHENTICATED' }

  const file = form.get('file')
  if (!(file instanceof Blob) || file.size === 0 || file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: 'composer.errors.imageType' }
  }
  const contentType = sniff(new Uint8Array(await file.slice(0, 12).arrayBuffer()))
  if (!contentType) return { ok: false, error: 'composer.errors.imageType' }

  const result = await uploadPostImage({
    userId: viewer.id,
    token: (await getAccessToken()) ?? '',
    body: file,
    contentType,
  })
  return result.ok ? result : { ok: false, error: 'composer.errors.imageUpload' }
}

/**
 * Deletes an image the person took out of their post or left with a discarded one (Q1). Only from
 * their own folder (removePostImage checks it). Best effort: the editor does not wait for it.
 */
export async function removePostImageAction(raw: unknown): Promise<ActionResult<null>> {
  const parsed = z.object({ imageUrl: z.url({ protocol: /^https$/ }) }).safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'api.errors.INVALID' }
  const viewer = await getViewer()
  if (!viewer) return { ok: false, error: 'api.errors.UNAUTHENTICATED' }
  await removePostImage({
    userId: viewer.id,
    token: (await getAccessToken()) ?? '',
    imageUrl: parsed.data.imageUrl,
  })
  return { ok: true, data: null }
}
