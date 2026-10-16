/** The types the post-images bucket accepts (asinko-app INFRA-PENDIENTES § Storage). */
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

/** The longest side after preparing: enough for the detail page at 2x. */
export const MAX_SIDE = 2048

/** Under Vercel's 4.5 MB request limit, with room for the form's other fields. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024

export type PreparedImage =
  | { ok: true; blob: Blob; width: number; height: number }
  | { ok: false; error: 'type' | 'unreadable' | 'tooLarge' }

/**
 * Gets an image ready to upload (specs/post-image PI-03, PI-05): only JPEG, PNG or WebP; drawn
 * again on a canvas, at most 2048px on its longest side and as WebP. Drawing it again drops its
 * metadata (EXIF, with the place it was taken, security.md § 6); the photo's orientation is kept.
 * A browser that cannot write WebP gives JPEG, which the bucket takes too. Never throws.
 */
export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) return { ok: false, error: 'type' }

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    return { ok: false, error: 'unreadable' }
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) return { ok: false, error: 'unreadable' }
  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await toBlob(canvas, 'image/webp').then((webp) =>
    webp?.type === 'image/webp' ? webp : toBlob(canvas, 'image/jpeg'),
  )
  if (!blob) return { ok: false, error: 'unreadable' }
  if (blob.size > MAX_UPLOAD_BYTES) return { ok: false, error: 'tooLarge' }
  return { ok: true, blob, width, height }
}

/** A part of an image in its own pixels (react-easy-crop's croppedAreaPixels). */
export type CropArea = { x: number; y: number; width: number; height: number }

/**
 * Cuts the chosen part of an image and draws it at the final size (specs/profile-presentation
 * PP-07: a photo of 400x400, a banner of 1500x375), as prepareImage: only JPEG, PNG or WebP, the
 * photo's orientation kept, its metadata dropped, WebP (or JPEG) under the upload limit. Never throws.
 */
export async function cropImage(
  file: File,
  area: CropArea,
  size: { width: number; height: number },
): Promise<PreparedImage> {
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) return { ok: false, error: 'type' }

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    return { ok: false, error: 'unreadable' }
  }

  const canvas = document.createElement('canvas')
  canvas.width = size.width
  canvas.height = size.height
  const context = canvas.getContext('2d')
  if (!context) return { ok: false, error: 'unreadable' }
  context.drawImage(bitmap, area.x, area.y, area.width, area.height, 0, 0, size.width, size.height)
  bitmap.close()

  const blob = await toBlob(canvas, 'image/webp').then((webp) =>
    webp?.type === 'image/webp' ? webp : toBlob(canvas, 'image/jpeg'),
  )
  if (!blob) return { ok: false, error: 'unreadable' }
  if (blob.size > MAX_UPLOAD_BYTES) return { ok: false, error: 'tooLarge' }
  return { ok: true, blob, width: size.width, height: size.height }
}

function toBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, 0.85))
}
