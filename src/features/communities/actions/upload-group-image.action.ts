'use server'

import { z } from 'zod'
import type { ActionResult } from '@/lib/result'
import { MAX_UPLOAD_BYTES } from '@/lib/prepare-image'
import { getViewer } from '@/lib/session'
import { uploadSignedImage } from '@/lib/uploads/signed-image-upload'
import { sniffImage } from '@/lib/uploads/sniff-image'
import { updateGroupImageAs } from '../lib/update-group-images'
import { groupSlugSchema } from '../schemas/create-group.schema'

const inputSchema = z.object({
  communityId: z.uuid(),
  slug: groupSlugSchema,
  kind: z.enum(['avatar', 'banner']),
})

const UPLOAD_ERRORS = {
  type: 'createGroup.errors.imageType',
  unauthenticated: 'api.errors.UNAUTHENTICATED',
  upload: 'createGroup.errors.imageUpload',
} as const

/**
 * Uploads a new group's photo or banner, already cropped and prepared in the browser, once the
 * group exists (specs/community-create CG-11, Q5): through the backend's signed URL for a group's
 * images (P-029), then saved on the group with PATCH. One call per image: two of 4 MB would not
 * fit in one Server Action. A public endpoint: checks the session, the input, the size and the
 * bytes; the backend decides if the viewer moderates the group.
 */
export async function uploadGroupImage(
  form: FormData,
): Promise<ActionResult<{ imageUrl: string | null }>> {
  const viewer = await getViewer()
  if (!viewer) return { ok: false, error: 'api.errors.UNAUTHENTICATED' }

  const input = inputSchema.safeParse({
    communityId: form.get('communityId'),
    slug: form.get('slug'),
    kind: form.get('kind'),
  })
  const file = form.get('file')
  if (!input.success || !(file instanceof Blob) || file.size === 0) {
    return { ok: false, error: 'createGroup.errors.imageType' }
  }
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: 'createGroup.errors.imageTooLarge' }
  const contentType = sniffImage(new Uint8Array(await file.slice(0, 12).arrayBuffer()))
  if (!contentType) return { ok: false, error: 'createGroup.errors.imageType' }

  const { communityId, slug, kind } = input.data
  const uploaded = await uploadSignedImage('/api/v1/uploads/community-image', {
    userId: viewer.id,
    body: file,
    contentType,
    extra: { communityId },
  })
  if (!uploaded.ok) return { ok: false, error: UPLOAD_ERRORS[uploaded.error] }
  const saved = await updateGroupImageAs(viewer.id, slug, kind, uploaded.data.imageUrl)
  return saved.ok ? saved : { ok: false, error: saved.errorKey }
}
