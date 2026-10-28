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
  /** The asset's page: /asset/{SYMBOL} (specs/community-pages CP-14). */
  path: string
  /** Marked as a favorite (specs/favorites FV-01): first, with its star. */
  favorite: boolean
}

export type Person = {
  /** The profile: /user/{username} (CP-21). */
  path: string
  /** How it is mentioned: @maria */
  handle: string
  id: string
  username: string
  avatarUrl: string | null
  accuracyRate: number | null
  /** Their personal channel: following them is being its member, and its favorite is theirs. */
  channelSlug: string
  /** Marked as a favorite (specs/favorites FV-01). */
  favorite: boolean
}

export type Group = {
  /** How it is mentioned: #defi */
  handle: string
  slug: string
  /** Its page: /hub/{slug} (CP-14). */
  path: string
  name: string
  description: string | null
  /** The title of its main post (P-016): what is being talked about there (IR-01). */
  topPostTitle: string | null
  /** The last line to say about it, when there is no post nor description. */
  memberCount: number
  avatarUrl: string | null
  isModerator: boolean
  /** Marked as a favorite (specs/favorites FV-01). */
  favorite: boolean
}

export type Suggestion = {
  /** $BTC for an asset community, #slug for a group */
  handle: string
  slug: string
  /** Its page: /hub/{slug} or /asset/{SYMBOL} (CP-14). */
  path: string
  name: string
  memberCount: number
  /** What it is about, for the line under its name (IR-02): its main post, else this. */
  description: string | null
  topPostTitle: string | null
  avatarUrl: string | null
}

/** Each section loads on its own: one failing does not take down the others (H-19). */
export type SectionResult<T> = { ok: true; data: T } | { ok: false }

export type Interests = {
  /** Without a session the column shows only communities (H-07, decided 2026-10-03). */
  signedIn: boolean
  assets: SectionResult<AssetTile[]>
  people: SectionResult<Person[]>
  groups: SectionResult<Group[]>
  suggested: SectionResult<Suggestion[]>
}
