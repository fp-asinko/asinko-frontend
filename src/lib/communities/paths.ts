/** Which page a community belongs on: /hub, /asset or /user (specs/community-pages CP-02). */
export type CommunityKind = 'group' | 'asset' | 'user'

type CommunityType =
  'SYSTEM_ASSET' | 'SYSTEM_GEO' | 'SYSTEM_CATEGORY' | 'USER_PUBLIC' | 'PERSONAL_CHANNEL'

/** Assets and personal channels have their own pages; every other community is a group. */
export function kindOf(type: CommunityType): CommunityKind {
  if (type === 'SYSTEM_ASSET') return 'asset'
  if (type === 'PERSONAL_CHANNEL') return 'user'
  return 'group'
}

const BASE: Record<CommunityKind, string> = { group: '/hub', asset: '/asset', user: '/user' }

/**
 * The page of a community, the same in every locale (CP-01). Shared by the feed (mentions, card
 * headers), the interests column and the community pages, which cannot import each other.
 */
export function communityPath(kind: CommunityKind, slug: string): string {
  return `${BASE[kind]}/${encodeURIComponent(slug)}`
}

type NamedCommunity = { type: CommunityType; slug: string; name: string }

/**
 * An asset community's symbol, from its name ("$BRK.B"), never from its slug: the slug is not the
 * symbol ("brk-b", backend 2026-10-20, specs/backend-answer-1020 BA-10). A name without "$" (the
 * mocks' "Bitcoin") falls back to the slug, which matches the symbol in them.
 */
export function assetSymbolOf({ slug, name }: Pick<NamedCommunity, 'slug' | 'name'>): string {
  return name.startsWith('$') && name.length > 1 ? name.slice(1) : slug.toUpperCase()
}

/** A community as its mention ($BRK.B, #macro, @maria) and its page, both from the same place. */
export function mentionOf(community: NamedCommunity): { handle: string; path: string } {
  const kind = kindOf(community.type)
  if (kind === 'asset') {
    const symbol = assetSymbolOf(community)
    return { handle: `$${symbol}`, path: communityPath('asset', symbol) }
  }
  const sign = kind === 'user' ? '@' : '#'
  return { handle: `${sign}${community.slug}`, path: communityPath(kind, community.slug) }
}
