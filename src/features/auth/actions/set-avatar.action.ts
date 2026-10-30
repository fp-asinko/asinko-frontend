'use server'

import { setSessionAvatar } from '@/lib/auth/session'
import { MAX_UPLOAD_BYTES } from '@/lib/prepare-image'
import type { ActionResult } from '@/lib/result'
import { getViewer } from '@/lib/session'
import { uploadSignedImage } from '@/lib/uploads/signed-image-upload'
import { sniffImage } from '@/lib/uploads/sniff-image'
import { saveAvatar } from '../lib/profile-api'

/**
 * The welcome screen's photo (specs/auth AU-21, design.md § 11), already cut square and prepared in
 * the browser: uploaded through the backend's signed URL and saved in the new profile. A public
 * endpoint: checks the session (a profile already) and the bytes itself. The same checks as
 * "Edit profile" (communities' uploadProfileImage): features do not import each other.
 */
export async function setAvatar(form: FormData): Promise<ActionResult<null>> {
  const viewer = await getViewer()
  if (!viewer) return { ok: false, error: 'auth.errors.noSession' }

  const file = form.get('file')
  if (!(file instanceof Blob) || file.size === 0)
    return { ok: false, error: 'auth.errors.photoType' }
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: 'auth.errors.photoTooLarge' }
  const contentType = sniffImage(new Uint8Array(await file.slice(0, 12).arrayBuffer()))
  if (!contentType) return { ok: false, error: 'auth.errors.photoType' }

  const uploaded = await uploadSignedImage('/api/v1/uploads/avatar', {
    userId: viewer.id,
    body: file,
    contentType,
  })
  const saved = uploaded.ok ? await saveAvatar(viewer.id, uploaded.data.imageUrl) : null
  if (!saved) return { ok: false, error: 'auth.errors.photoUpload' }
  // Its own avatar shows it at once (design.md § 14).
  await setSessionAvatar(saved)
  // The form's caller renders the page again when done (as createProfile).
  return { ok: true, data: null }
}
