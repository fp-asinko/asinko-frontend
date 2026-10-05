/**
 * Remote hosts the site may show user images from (security.md § 6), shared by the feed mappers
 * and next.config.ts (images.remotePatterns): only the public buckets of the backend's Supabase
 * Storage (dev project; the production project joins when it exists). Same-site paths are always
 * allowed.
 * An image from any other host is dropped instead of breaking the page: next/image throws on
 * unconfigured hosts, and user content must never take a page down.
 */
export const REMOTE_IMAGE_HOSTS: readonly string[] = ['hqarefesoovfmibncivu.supabase.co']

/** Only public Storage objects: never another path of the Supabase project. */
export const REMOTE_IMAGE_PATH = '/storage/v1/object/public/'

/** The URL to render for a user image, or null when it is not allowed. */
export function allowedImageUrl(url: string | null): string | null {
  if (!url) return null
  if (url.startsWith('/') && !url.startsWith('//')) return url
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' &&
      REMOTE_IMAGE_HOSTS.includes(parsed.hostname) &&
      parsed.pathname.startsWith(REMOTE_IMAGE_PATH)
      ? url
      : null
  } catch {
    return null
  }
}
