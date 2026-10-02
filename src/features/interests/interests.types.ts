// Domain types of the "Your interests" column (specs/home/design.md §4). The UI only knows these,
// never the raw contract shapes.

export type AssetTile = {
  /** How it is mentioned: $BTC */
  handle: string
  symbol: string
  name: string
  changePct: number | null
  price: number | null
  stale: boolean
  /** Slug of the asset community: the tile links to the Home filtered by it. */
  communitySlug: string
}

export type Person = {
  /** How it is mentioned: @maria */
  handle: string
  id: string
  username: string
  avatarUrl: string | null
  accuracyRate: number | null
}

export type Group = {
  /** How it is mentioned: #defi */
  handle: string
  slug: string
  name: string
  description: string | null
  avatarUrl: string | null
  isModerator: boolean
}

export type Suggestion = {
  /** $BTC for an asset community, #slug for a group */
  handle: string
  slug: string
  name: string
  memberCount: number
  avatarUrl: string | null
}

/** Each section loads on its own: one failing does not take down the others (H-19). */
export type SectionResult<T> = { ok: true; data: T } | { ok: false }

export type Interests = {
  assets: SectionResult<AssetTile[]>
  people: SectionResult<Person[]>
  groups: SectionResult<Group[]>
  suggested: SectionResult<Suggestion[]>
}
