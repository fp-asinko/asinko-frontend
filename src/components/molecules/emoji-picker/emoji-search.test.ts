// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { EMOJI_CATEGORIES } from './emoji-data'
import { emojiLabel, findEmoji, searchEmojis } from './emoji-search'

const found = (query: string, locale: 'en' | 'es' | 'pt' = 'en') =>
  searchEmojis(query, locale).map((row) => row[0])

describe('emoji list (specs/emoji-picker EP-06)', () => {
  const rows = EMOJI_CATEGORIES.flatMap((category) => category.rows)

  it('has each emoji once, with keywords in the three languages', () => {
    expect(new Set(rows.map((row) => row[0])).size).toBe(rows.length)
    for (const row of rows) for (const words of row.slice(1)) expect(words.trim()).not.toBe('')
    expect(rows.length).toBeGreaterThan(250)
  })

  it('has no flags (regional indicators) and keeps the finance ones', () => {
    expect(rows.some((row) => /[\u{1F1E6}-\u{1F1FF}]/u.test(row[0]))).toBe(false)
    for (const emoji of ['📈', '📉', '💰', '💸', '🚀', '🐂', '🐻', '💎', '🔥', '⚠️']) {
      expect(findEmoji(emoji)).toBeDefined()
    }
  })
})

describe('searchEmojis (EP-04)', () => {
  it('finds by the start of a word, in the page language or in English', () => {
    expect(found('fue', 'es')).toContain('🔥')
    expect(found('fire', 'es')).toContain('🔥')
    expect(found('fogo', 'pt')).toContain('🔥')
    expect(found('rocket')).toEqual(['🚀'])
  })

  it('ignores case and accents, and needs every word', () => {
    expect(found('ÁRBOL', 'es')).toContain('🌳')
    expect(found('grafico sub', 'es')).toEqual(['📈'])
    expect(found('zzzqqq')).toEqual([])
    expect(found('   ')).toEqual([])
  })

  it('labels an emoji in the page language', () => {
    expect(emojiLabel(findEmoji('🐂')!, 'es')).toBe('toro alcista')
  })
})
