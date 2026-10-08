/** A piece of a text: plain, or a match of what was searched (specs/post-detail-refresh PD-05). */
export type Highlighted = { text: string; match: boolean }

/** One character folded as the search does: lower case, without accents ("É" → "e"). */
const fold = (char: string) =>
  char
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

/**
 * Splits a text into plain parts and the matches of a search, without minding case or accents,
 * keeping the text as written: "Énfasis" searched as "enfasis" marks "Énfasis".
 */
export function highlightMatches(text: string, query: string): Highlighted[] {
  const chars = Array.from(text)
  const folded = chars.map(fold)
  const needle = Array.from(query.trim()).map(fold).join('')
  if (!needle) return text ? [{ text, match: false }] : []

  const parts: Highlighted[] = []
  let plain = ''
  let i = 0
  while (i < chars.length) {
    // Grow from here while the folded characters still spell the start of the needle.
    let built = ''
    let end = i
    while (end < chars.length && built.length < needle.length) {
      built += folded[end]
      end += 1
      if (!needle.startsWith(built)) break
    }
    if (built === needle) {
      if (plain) parts.push({ text: plain, match: false })
      parts.push({ text: chars.slice(i, end).join(''), match: true })
      plain = ''
      i = end
    } else {
      plain += chars[i]
      i += 1
    }
  }
  if (plain) parts.push({ text: plain, match: false })
  return parts
}
