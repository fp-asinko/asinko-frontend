// Domain types of the community, asset and profile pages (specs/community-pages § 3). The UI only
// knows these, never the raw contract shapes.

import type { AchievementCode } from '@/lib/api/contract'
import type { CommunityKind } from '@/lib/communities/paths'
import type { OpenTo } from './open-to.constants'
import type { ProfileLink } from '@/lib/profile-links'

export type { CommunityKind }

/** The profile part of a /user page (specs/community-pages § 12). */
export type ProfileDetails = {
  /** The user's id: their theses are asked by it (specs/profile-track-record). */
  id: string
  username: string
  /** P-011: null until the backend sends it; the title is then @username. */
  displayName: string | null
  badge: 'verified' | 'institutional' | null
  bio: string | null
  avatarUrl: string | null
  /** The presentation, as LinkedIn's (specs/profile-presentation, P-019, P-020): null if unset. */
  headline: string | null
  city: string | null
  /** ISO 3166-1 alpha-2; the name, in the page's language. */
  countryCode: string | null
  /** Up to five, only http(s), in the person's order. */
  links: ProfileLink[]
  /** What they are open to (P-026, specs/profile-showcase PS-10), in the list's order. */
  openTo: OpenTo[]
  /** Their own banner; null: the personal channel's, or the color of their identity. */
  bannerUrl: string | null
  followerCount: number
  followingCount: number
  accuracyRate: number | null
  /** The points of their reputation (specs/profile-aside PA-01). */
  points: number
  /** The track record (PT-02): theses resolved right, wrong, and cancelled. */
  correctCount: number
  incorrectCount: number
  cancelledCount: number
  currentStreak: number
  /** When they joined Asinko ("Member since", specs/mention-preview MP-05). */
  joinedAt: string
  /** The viewer is this user: no follow actions (CP-12). */
  isSelf: boolean
}

/** What "Edit profile" starts with (specs/profile-presentation PP-05): what the profile has now. */
export type EditableProfile = Pick<
  ProfileDetails,
  | 'username'
  | 'displayName'
  | 'headline'
  | 'countryCode'
  | 'city'
  | 'bio'
  | 'avatarUrl'
  | 'bannerUrl'
  | 'openTo'
> & { links: string[] }

/**
 * A field "Edit profile" can open on (PP-04: "Add a headline" goes to the headline), and each step
 * of "Complete your profile" (specs/profile-showcase PS-02).
 */
export type EditProfileField =
  'avatar' | 'banner' | 'headline' | 'bio' | 'location' | 'links' | 'openTo'

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

/** An asset of the catalog without a community yet: its page (specs/backend-answer-1013 BA-09). */
export type AssetSummary = {
  symbol: string
  /** $TSLA */
  handle: string
  name: string
  logoUrl: string | null
  /** Its community's slug; null while it has none. */
  communitySlug: string | null
  /** Its price (P-003, specs/backend-adoption BK-05); null without one. */
  market: AssetMarket | null
}

/** An asset's market data, as its page shows it. */
export type AssetMarket = {
  price: number
  /** The day's change in percent (2.14 is +2.14 %); null without one. */
  changePct: number | null
  /** The last price known, older than 15 minutes (priceStale). */
  stale: boolean
  updatedAt: string | null
  /** USD, or null for a currency pair (EUR/USD), whose price has no currency of its own. */
  currency: 'USD' | null
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

/** A thesis of a person's "Theses" tab (specs/profile-track-record PT-07). */
export type ThesisItem = {
  id: string
  /** The asset it is about, linked to its page; null for a qualitative thesis. */
  asset: { symbol: string; path: string } | null
  claim: string
  state: 'open' | 'correct' | 'incorrect' | 'expired' | 'disputed' | 'cancelled'
  /** What it bets on; null for a qualitative thesis (no asset, no price). */
  target: { direction: 'above' | 'below' | 'equals'; price: number } | null
  deadline: string
  /** LOW … EXTREME as 1 … 4 bars. */
  conviction: 1 | 2 | 3 | 4
  resolutionPrice: number | null
  cancellationReason: string | null
  publishedAt: string
}

export type ThesesPage = { items: ThesisItem[]; nextCursor: string | null }

/** Which list of a person (specs/follow-lists). */
export type FollowKind = 'followers' | 'following'

/** Which list of people: a person's (specs/follow-lists) or a community's (specs/community-members). */
export type PeopleList = FollowKind | 'members'

/** Where a list of people comes from: a person's id, or a community's slug. */
export type PeopleSource = { list: FollowKind; userId: string } | { list: 'members'; slug: string }

/** A person in a followers or following list (FL-02, FL-05). */
export type FollowItem = {
  username: string
  /** Their page: /user/maria. */
  path: string
  avatarUrl: string | null
  accuracyRate: number | null
  /** Whether the viewer follows them; null when unknown (no session, or P-017 not there yet). */
  followed: boolean | null
  /** The viewer themself: no button. */
  isSelf: boolean
}

/** Where a featured item belongs (specs/profile-showcase PS-05): its community, as a mention. */
type FeaturedCommunity = { handle: string; path: string }

/** A post or a thesis a person put at the front of their profile (P-025, PS-05): a small card. */
export type FeaturedItem =
  | {
      kind: 'post'
      id: string
      title: string
      path: string
      community: FeaturedCommunity
      score: number
      commentCount: number
    }
  | {
      /** A poll has no page yet: its card leads to the profile's posts. */
      kind: 'poll'
      id: string
      title: string
      community: FeaturedCommunity
      commentCount: number
    }
  | {
      kind: 'thesis'
      id: string
      claim: string
      state: ThesisItem['state']
      community: FeaturedCommunity
    }

/** The four groups of the catalog (specs/profile-achievements AC-01). */
export type AchievementGroup = 'theses' | 'community' | 'tenure' | 'profile'

/** An achievement (P-030): earned (`earnedAt`) or, on your own profile, missing. */
export type Achievement = {
  code: AchievementCode
  group: AchievementGroup
  earnedAt: string | null
  /** The anniversary's years. */
  level: number | null
  progress: { current: number; target: number } | null
}

/** A community or asset where a person published lately (P-027, specs/profile-aside PA-05). */
export type ActiveCommunity = {
  /** $GGAL, #macro or @maria. */
  handle: string
  path: string
  avatarUrl: string | null
  /** The stable key of its color: its slug. */
  colorKey: string
  kind: CommunityKind
  postCount: number
}

/** A link a moderator wrote (specs/community-widgets CW-07): a page of the site, or http(s). */
export type WidgetLink = {
  /** Used as is: a path of the site (/hub/defi) or an http(s) URL. */
  url: string
  external: boolean
  /** The real host of an external link (security.md § 1); null for a page of the site. */
  host: string | null
}

/** A community in a "Communities" widget (CW-06), with what its row and "Join" need. */
export type WidgetCommunity = {
  id: string
  slug: string
  handle: string
  name: string
  path: string
  kind: CommunityKind
  avatarUrl: string | null
  memberCount: number
  /** null without a session: "Join" asks to sign in. */
  viewerIsMember: boolean | null
}

/** A widget of a group's right column (P-028, CW-06), as the UI shows and edits it. */
export type CommunityWidget = { id: string; title: string } & (
  | { type: 'TEXT'; body: string }
  | { type: 'RULES'; rules: { title: string; description: string }[] }
  | { type: 'BUTTONS'; buttons: { label: string; link: WidgetLink }[] }
  | { type: 'COMMUNITIES'; communities: WidgetCommunity[] }
  | { type: 'IMAGES'; images: { src: string; alt: string; link: WidgetLink | null }[] }
  | {
      type: 'CALENDAR'
      events: {
        title: string
        startsAt: string
        endsAt: string | null
        allDay: boolean
        location: string | null
        link: WidgetLink | null
      }[]
    }
)
