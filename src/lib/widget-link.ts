/**
 * A link a user wrote, as the site may show it (security.md § 1, specs/community-widgets CW-07): a
 * page of the site ("/hub/defi", never "//elsewhere"), or http(s) with its real host. Anything
 * else (javascript:, data:, a broken URL) is no link: null.
 */
export function toWidgetLink(
  value: string | null | undefined,
): { url: string; external: boolean; host: string | null } | null {
  const url = value?.trim()
  if (!url) return null
  if (url.startsWith('/')) return url.startsWith('//') ? null : { url, external: false, host: null }
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
    return { url: parsed.href, external: true, host: parsed.hostname.replace(/^www\./, '') }
  } catch {
    return null
  }
}
