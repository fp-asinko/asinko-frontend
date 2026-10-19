'use server'

import { z } from 'zod'
import type { ActionResult } from '@/lib/result'
import { MAX_UPLOAD_BYTES } from '@/lib/prepare-image'
import { getViewer } from '@/lib/session'
import { uploadSignedImage } from '@/lib/uploads/signed-image-upload'
import { sniffImage } from '@/lib/uploads/sniff-image'

/**
 * Uploads an image of a group's "Images" widget, already prepared in the browser (specs/community-
 * widgets CW-11), through the backend's signed URL (P-029). A public endpoint: checks the session
 * itself, the group's id, the size and the bytes before asking the backend, which decides if the
 * viewer moderates it. Answers the image's URL, which Save then sends.
 */
export async function uploadWidgetImage(
  form: FormData,
): Promise<ActionResult<{ imageUrl: string }>> {
  const viewer = await getViewer()
  if (!viewer) return { ok: false, error: 'api.errors.UNAUTHENTICATED' }

  const communityId = z.uuid().safeParse(form.get('communityId'))
  const file = form.get('file')
  if (!communityId.success || !(file instanceof Blob) || file.size === 0) {
    return { ok: false, error: 'communities.widgets.errors.imageType' }
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: 'communities.widgets.errors.imageTooLarge' }
  }
  const contentType = sniffImage(new Uint8Array(await file.slice(0, 12).arrayBuffer()))
  if (!contentType) return { ok: false, error: 'communities.widgets.errors.imageType' }

  const result = await uploadSignedImage('/api/v1/uploads/community-image', {
    userId: viewer.id,
    body: file,
    contentType,
    extra: { communityId: communityId.data },
  })
  if (result.ok) return result
  const errors = {
    type: 'communities.widgets.errors.imageType',
    unauthenticated: 'api.errors.UNAUTHENTICATED',
    upload: 'communities.widgets.errors.imageUpload',
  } as const
  return { ok: false, error: errors[result.error] }
}
