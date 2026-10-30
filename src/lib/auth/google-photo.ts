/**
 * The Google photo a new account brings (specs/auth design.md § 15): offered in the welcome
 * screen. The server downloads it and gives the browser its bytes, so the CSP does not open to
 * Google. The session cookie is not signed: its URL is checked again before every download, and
 * only Google's photo hosts are ever asked (no SSRF).
 */

/** Big enough for the 400x400 photo, small enough to go to the browser as text. */
export const GOOGLE_PHOTO_MAX_BYTES = 1024 * 1024

const PHOTO_SIZE = 400
const PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

/**
 * The photo's URL when it is a Google one over https, asked at 400 px (Google's `=s96-c` ending
 * says the size); null for anything else.
 */
export function googlePhotoUrl(raw: string | null | undefined): string | null {
  if (!raw) return null
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) return null
  if (!url.hostname.endsWith('.googleusercontent.com')) return null
  return url.toString().replace(/=s\d+(-c)?$/, `=s${PHOTO_SIZE}-c`)
}

export type GooglePhoto = { type: string; base64: string }

/**
 * Downloads the photo: Google's hosts only, no redirects, an image type and under the limit, or
 * null. Never throws.
 */
export async function downloadGooglePhoto(
  raw: string | null | undefined,
  fetchImpl: typeof fetch,
  timeoutMs: number,
): Promise<GooglePhoto | null> {
  const url = googlePhotoUrl(raw)
  if (!url) return null
  try {
    const response = await fetchImpl(url, {
      redirect: 'error',
      cache: 'no-store',
      signal: AbortSignal.timeout(timeoutMs),
    })
    const type = response.headers.get('content-type')?.split(';')[0]?.trim() ?? ''
    if (!response.ok || !PHOTO_TYPES.has(type)) return null
    const bytes = new Uint8Array(await response.arrayBuffer())
    if (bytes.length === 0 || bytes.length > GOOGLE_PHOTO_MAX_BYTES) return null
    return { type, base64: Buffer.from(bytes).toString('base64') }
  } catch {
    return null
  }
}
