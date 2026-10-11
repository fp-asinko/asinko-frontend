// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { safeLocale } from './safe-locale'

describe('safeLocale', () => {
  it('keeps one of our locales and falls back to English for anything else', () => {
    expect(safeLocale('es')).toBe('es')
    expect(safeLocale('pt')).toBe('pt')
    expect(safeLocale('fr')).toBe('en')
    expect(safeLocale('')).toBe('en')
  })
})
