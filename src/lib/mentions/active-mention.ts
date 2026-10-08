/** What each symbol mentions (docs/product/overview.md § Menciones). */
export type MentionKind = 'asset' | 'community' | 'user'

const KINDS: Record<string, MentionKind> = { $: 'asset', '#': 'community', '@': 'user' }

/** The longest query worth searching: tickers, slugs and usernames are shorter. */
const QUERY_MAX = 32

// A symbol at the start or after whitespace, then at least one letter (Q2: no list for the bare
// symbol), up to the caret. Letters of any language, digits, "_" and "-".
const ACTIVE = new RegExp(`(?:^|\\s)([$#@])([\\p{L}\\p{N}_-]{1,${QUERY_MAX}})$`, 'u')

export type ActiveMention = {
  kind: MentionKind
  /** What was typed after the symbol. */
  query: string
  /** Where the symbol is: the mention replaces from here to the caret. */
  start: number
}

/**
 * The mention being written right before the caret, if any (specs/mention-autocomplete MA-01,
 * MA-06): "$bt|" → asset "bt". Not inside a word ("mail@x"), not after a space ("$bt |"), and
 * not for the bare symbol.
 */
export function activeMention(text: string, caret: number): ActiveMention | null {
  const match = ACTIVE.exec(text.slice(0, caret))
  if (!match) return null
  const [, symbol = '', query = ''] = match
  const kind = KINDS[symbol]
  if (!kind) return null
  return { kind, query, start: caret - query.length - 1 }
}
