// Domain types of the community, asset and profile pages (specs/community-pages § 3). The UI only
// knows these, never the raw contract shapes.

import type { CommunityKind } from '@/lib/communities/paths'

export type { CommunityKind }

/** The profile part of a /user page (specs/community-pages § 12). */
export type ProfileDetails = {
  username: string
  /** P-011: null until the backend sends it; the title is then @username. */
  displayName: string | null
  badge: 'verified' | 'institutional' | null
  bio: string | null
  avatarUrl: string | null
  followerCount: number
  accuracyRate: number | null
  currentStreak: number
  /** When they joined Asinko ("Member since", specs/mention-preview MP-05). */
  joinedAt: string
  /** The viewer is this user: no follow actions (CP-12). */
  isSelf: boolean
}

export type CommunityPage = {
  /** Where a post from this page goes (specs/post-create-detail PC-06). */
  id: string
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
  /** When a person created it; null for the system's (assets, regions, categories). */
  createdAt: string | null
  rules: string | null
  /** Only http(s), with the real domain to show (security.md § 1). */
  mainUrl: { url: string; domain: string } | null
  viewerMembership: 'MEMBER' | 'MODERATOR' | 'PRINCIPAL_MODERATOR' | null
  viewerIsFavorite: boolean
}

/** The community part of a hover card (specs/mention-preview § 3): only what the card shows. */
export type PreviewCommunity = Pick<
  CommunityPage,
  | 'slug'
  | 'handle'
  | 'subtitle'
  | 'description'
  | 'avatarUrl'
  | 'bannerUrl'
  | 'kind'
  | 'memberCount'
  | 'createdAt'
  | 'viewerMembership'
>

/** A hover card: a group or an asset, or a person with their personal channel. */
export type Preview = { community: PreviewCommunity; profile: ProfileDetails | null }
