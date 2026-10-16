import type { CommunityKind } from '../composer.types'

/**
 * What the picker's search asks for (specs/picker-filters PF-03): a leading `$` means assets and a
 * leading `#` means groups, as in mentions; the symbol itself is not searched. Without one, the
 * kind is whatever the chips say (null).
 */
export function readSearch(text: string): {
  kind: Exclude<CommunityKind, 'all'> | null
  search: string
} {
  const trimmed = text.trim()
  if (trimmed.startsWith('$')) return { kind: 'assets', search: trimmed.slice(1).trim() }
  if (trimmed.startsWith('#')) return { kind: 'groups', search: trimmed.slice(1).trim() }
  return { kind: null, search: trimmed }
}
