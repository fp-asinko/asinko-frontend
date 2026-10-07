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
