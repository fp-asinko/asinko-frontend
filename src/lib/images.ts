/**
 * Remote hosts the site may show user images from (security.md § 6), shared by the feed mappers
 * (which drop any other image) and next.config.ts (images.remotePatterns). Empty until the
 * backend's post-images bucket (Supabase Storage) is in use; same-site paths are always allowed.
 * An image from any other host is dropped instead of breaking the page: next/image throws on
 * unconfigured hosts, and user content must never take a page down.
 */
export const REMOTE_IMAGE_HOSTS: readonly string[] = []

/** The URL to render for a user image, or null when it is not allowed. */
export function allowedImageUrl(url: string | null): string | null {
  if (!url) return null
  if (url.startsWith('/') && !url.startsWith('//')) return url
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && REMOTE_IMAGE_HOSTS.includes(parsed.hostname) ? url : null
  } catch {
    return null
  }
}
