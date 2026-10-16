/** The sites a profile link gets an icon for (specs/profile-presentation PP-03); the rest, "web". */
export type LinkSite =
  'x' | 'linkedin' | 'youtube' | 'instagram' | 'github' | 'substack' | 'tradingview' | 'web'

export type ProfileLink = {
  url: string
  /** The real host, shown beside the icon so a link cannot pass for another (security.md § 1). */
  host: string
  site: LinkSite
}

/** Hosts of each site, matched exactly or as a subdomain (maria.substack.com). */
const SITES: ReadonlyArray<readonly [LinkSite, readonly string[]]> = [
  ['x', ['x.com', 'twitter.com']],
  ['linkedin', ['linkedin.com']],
  ['youtube', ['youtube.com', 'youtu.be']],
  ['instagram', ['instagram.com']],
  ['github', ['github.com']],
  ['substack', ['substack.com']],
  ['tradingview', ['tradingview.com']],
]

/** Only http(s) links (security.md § 1): javascript:, data: and the rest are not links. */
export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/** A profile link as the profile shows it, or null when it is not an http(s) URL. */
export function toProfileLink(value: string): ProfileLink | null {
  const url = value.trim()
  if (!isHttpUrl(url)) return null
  const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '')
  const site =
    SITES.find(([, hosts]) =>
      hosts.some((each) => host === each || host.endsWith(`.${each}`)),
    )?.[0] ?? 'web'
  return { url, host, site }
}
