import type { RawCommunity } from '@/lib/api/contract'
import { allowedImageUrl } from '@/lib/images'
import { kindOf } from '@/lib/communities/paths'
import type { CommunityKind, CommunityPage } from '../communities.types'

export { kindOf }

const SYMBOL: Record<CommunityKind, string> = { group: '#', asset: '$', user: '@' }

/** Only http(s) links, with the real domain to show (security.md § 1). */
function safeLink(url: string | null): CommunityPage['mainUrl'] {
  if (!url) return null
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
    return { url: parsed.href, domain: parsed.hostname.replace(/^www\./, '') }
  } catch {
    return null
  }
}

export function toCommunityPage(community: RawCommunity): CommunityPage {
  const kind = kindOf(community.type)
  const handle = `${SYMBOL[kind]}${community.slug}`
  // The backend names system communities with their symbol (#Macro, $BTC): no subtitle then.
  const bareName = community.name.replace(/^[#$@]/, '')
  const subtitle = bareName.toLowerCase() === community.slug.toLowerCase() ? null : community.name
  return {
    slug: community.slug,
    handle,
    subtitle,
    description: community.description?.trim() || null,
    avatarUrl: allowedImageUrl(community.avatarUrl),
    bannerUrl: allowedImageUrl(community.bannerUrl),
    kind,
    memberCount: community.memberCount,
    rules: community.rules?.trim() || null,
    mainUrl: safeLink(community.mainUrl),
    viewerMembership: community.viewerMembership,
    viewerIsFavorite: community.viewerIsFavorite === true,
  }
}
