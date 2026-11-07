import type { RawCommunity } from '@/lib/api/contract'
import { allowedImageUrl } from '@/lib/images'
import { kindOf, mentionOf } from '@/lib/communities/paths'
import type { CommunityPage, EditableGroup } from '../communities.types'

export { kindOf }

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

/**
 * Without a session there is no membership nor favorite, whatever the response says (the backend
 * already sends null; the mocks answer as the demo user): the same rule as the cards (CF-12).
 */
export function toCommunityPage(community: RawCommunity, signedIn = true): CommunityPage {
  const kind = kindOf(community.type)
  // An asset's handle and page come from its symbol, never from its slug (specs/backend-answer-1020
  // BA-10).
  const { handle, path } = mentionOf(community)
  // The backend names system communities with their symbol (#Macro, $BTC): no subtitle then.
  const bareName = community.name.replace(/^[#$@]/, '')
  const subtitle = bareName.toLowerCase() === handle.slice(1).toLowerCase() ? null : community.name
  return {
    id: community.id,
    slug: community.slug,
    handle,
    path,
    name: community.name,
    subtitle,
    description: community.description?.trim() || null,
    avatarUrl: allowedImageUrl(community.avatarUrl),
    bannerUrl: allowedImageUrl(community.bannerUrl),
    kind,
    memberCount: community.memberCount,
    createdAt: community.createdByProfileId ? community.createdAt : null,
    rules: community.rules?.trim() || null,
    mainUrl: safeLink(community.mainUrl),
    viewerMembership: signedIn ? community.viewerMembership : null,
    viewerIsFavorite: signedIn && community.viewerIsFavorite === true,
  }
}

/** What "Edit group" starts with (specs/community-edit § 3): only what the window shows. */
export function toEditableGroup(page: CommunityPage): EditableGroup {
  return {
    id: page.id,
    slug: page.slug,
    handle: page.handle,
    name: page.name,
    description: page.description,
    rules: page.rules,
    mainUrl: page.mainUrl?.url ?? null,
    avatarUrl: page.avatarUrl,
    bannerUrl: page.bannerUrl,
  }
}
