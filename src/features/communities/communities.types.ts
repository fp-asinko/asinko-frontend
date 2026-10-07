// Domain types of the community, asset and profile pages (specs/community-pages § 3). The UI only
// knows these, never the raw contract shapes.

/** Which page a community belongs on: /hub, /asset or /user (CP-02). */
export type CommunityKind = 'group' | 'asset' | 'user'

export type CommunityPage = {
  slug: string
  /** #macro, $BTC or @maria: the page title. */
  handle: string
  /** The display name, only when it says more than the handle (NVIDIA under $NVDA). */
  subtitle: string | null
  description: string | null
  avatarUrl: string | null
  bannerUrl: string | null
  kind: CommunityKind
  memberCount: number
  rules: string | null
  /** Only http(s), with the real domain to show (security.md § 1). */
  mainUrl: { url: string; domain: string } | null
  viewerMembership: 'MEMBER' | 'MODERATOR' | 'PRINCIPAL_MODERATOR' | null
  viewerIsFavorite: boolean
}
