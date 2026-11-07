// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { slugAlternatives, slugify } from './slugify'

describe('slugify (specs/community-create CG-05)', () => {
  it('drops accents and turns symbols and spaces into single hyphens', () => {
    expect(slugify('Dividendos LatAm!')).toBe('dividendos-latam')
    expect(slugify('Acciones de São Paulo')).toBe('acciones-de-sao-paulo')
    expect(slugify('  AI  &  Options -- Flow ')).toBe('ai-options-flow')
    expect(slugify('Año 2026')).toBe('ano-2026')
  })

  it('cuts at 30 without leaving a hyphen at the end', () => {
    expect(slugify('a'.repeat(40))).toHaveLength(30)
    // The 30th character would be the hyphen between the words.
    expect(slugify(`${'a'.repeat(29)} bcd`)).toBe('a'.repeat(29))
  })

  it('is empty when nothing usable is left', () => {
    expect(slugify('')).toBe('')
    expect(slugify('¡¿!?')).toBe('')
  })
})

describe('slugAlternatives (specs/community-create CG-19)', () => {
  it('offers three endings that still fit 30 characters', () => {
    const year = new Date().getFullYear()
    expect(slugAlternatives('defi')).toEqual(['defi-2', `defi-${year}`, 'defi-hub'])
    for (const each of slugAlternatives('a'.repeat(28) + '-b')) {
      expect(each.length).toBeLessThanOrEqual(30)
      expect(each).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    }
  })
})
