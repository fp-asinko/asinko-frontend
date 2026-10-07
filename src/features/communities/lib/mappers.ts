import type { RawCommunity } from '@/lib/api/contract'
import { allowedImageUrl } from '@/lib/images'
import type { CommunityKind, CommunityPage } from '../communities.types'

/** The page of each community type: assets and personal channels have their own (CP-02). */
export function kindOf(type: RawCommunity['type']): CommunityKind {
  if (type === 'SYSTEM_ASSET') return 'asset'
  if (type === 'PERSONAL_CHANNEL') return 'user'
  return 'group'
}

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
