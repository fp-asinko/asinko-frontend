import type { RawAsset } from '@/lib/api/contract'

// Domain types of the post editor (specs/post-create-detail § 3). The UI only knows these.

/** A community the post can go to: what the picker shows. */
export type CommunityOption = {
  id: string
  /** Its slug: the page to create a post carries it in the URL (specs/submit-page). */
  slug: string
  /** #defi, $BTC, or @you for your own channel. */
  handle: string
  name: string
  /** Your own personal channel: shown first, as "Your profile". */
  own: boolean
  /** The tags a post of it can carry (P-023, specs/drafts-tags); none when absent. */
  tags?: string[]
}

/** What the picker lists (specs/picker-filters PF-01): everything, only groups or only assets. */
export type CommunityKind = 'all' | 'groups' | 'assets'

/**
 * The community of the page to create a post (specs/submit-page SU-03, SU-07): the picker's option
 * and what the card on the right shows.
 */
export type SubmitCommunity = {
  option: CommunityOption
  kind: 'group' | 'asset' | 'user'
  /** False for someone else's personal channel: only its owner posts there. */
  postable: boolean
  /** A group's name, or an asset's (Bitcoin under ); null when it only repeats the handle. */
  subtitle: string | null
  /** EQUITY, CRYPTO…: an asset's class. */
  assetClass: RawAsset['assetClass'] | null
  description: string | null
  avatarUrl: string | null
  bannerUrl: string | null
  memberCount: number
  /** When a person created it; null for the system's. */
  createdAt: string | null
  rules: string | null
}

/** A post saved in the account to finish later (P-022, specs/drafts-tags): what the editor had. */
export type SavedDraft = {
  id: string
  type: 'TEXT' | 'LINK' | 'IMAGE' | 'THOUGHT'
  title: string
  body: string
  url: string
  imageUrl: string | null
  imageAlt: string
  tag: string
  /** Where it goes, with its tags; null when not chosen yet, or no longer there. */
  community: CommunityOption | null
  /** Its related ones, as handles ($GGAL, #macro), as the editor holds them (P-018). */
  related: string[]
  updatedAt: string
}
