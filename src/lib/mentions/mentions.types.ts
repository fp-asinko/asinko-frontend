import type { MentionKind } from './active-mention'

/** A suggestion of the mention list (specs/mention-autocomplete MA-03). */
export type MentionOption = {
  kind: MentionKind
  /** What gets written: $BTC, #defi, @maria. */
  handle: string
  /** The name, only when it says more than the handle (Bitcoin under $BTC). */
  label: string | null
  avatarUrl: string | null
  /** Stable key for the identity color of the avatar: the symbol, slug or username. */
  colorKey: string
}
