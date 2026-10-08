import { EMOJI_CATEGORIES, type EmojiRow } from './emoji-data'

export type EmojiLocale = 'en' | 'es' | 'pt'

const COLUMN: Record<EmojiLocale, 1 | 2 | 3> = { en: 1, es: 2, pt: 3 }

/** Lower case and without accents, as the search reads: "Árbol" → "arbol". */
const fold = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

/** What a screen reader says for an emoji: its keywords in the page's language. */
export function emojiLabel(row: EmojiRow, locale: EmojiLocale): string {
  return row[COLUMN[locale]]
}

const ALL = EMOJI_CATEGORIES.flatMap((category) => category.rows)

/**
 * The emojis whose keywords, in the page's language or in English, start with every word typed
 * (specs/emoji-picker EP-04): "fue" or "fire" → 🔥, "gra sub" → 📈. Without case nor accents.
 */
export function searchEmojis(query: string, locale: EmojiLocale): EmojiRow[] {
  const words = fold(query).split(/\s+/).filter(Boolean)
  if (words.length === 0) return []
  return ALL.filter((row) => {
    const keywords = fold(`${row[COLUMN[locale]]} ${row[1]}`).split(/\s+/)
    return words.every((word) => keywords.some((keyword) => keyword.startsWith(word)))
  })
}

/** The row of an emoji, to show the recent ones with their names. */
export function findEmoji(emoji: string): EmojiRow | undefined {
  return ALL.find((row) => row[0] === emoji)
}
