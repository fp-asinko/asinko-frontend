// Domain types of the community, asset and profile pages (specs/community-pages § 3). The UI only
// knows these, never the raw contract shapes.

import type { CommunityKind } from '@/lib/communities/paths'

export type { CommunityKind }

/** The profile part of a /user page (specs/community-pages § 12). */
export type ProfileDetails = {
  username: string
  /** P-011: null until the backend sends it; the title is then @username. */
  displayName: string | null
  tier: 'creator' | 'partner' | null
  /** AAA (best) to D (P-011). */
  rating: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'C' | 'D' | null
  badge: 'verified' | 'institutional' | null
  bio: string | null
  avatarUrl: string | null
  followerCount: number
  accuracyRate: number | null
  currentStreak: number
  /** The viewer is this user: no follow actions (CP-12). */
  isSelf: boolean
}

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
