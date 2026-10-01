// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { routing } from '@/i18n/routing'
import en from '../../messages/en.json'
import es from '../../messages/es.json'
import pt from '../../messages/pt.json'

// F-14: every locale has exactly the same keys as en.json, the source of all keys.
const MESSAGES: Record<string, unknown> = { en, es, pt }

function flattenKeys(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix]
  return Object.entries(value).flatMap(([key, child]) =>
    flattenKeys(child, prefix ? `${prefix}.${key}` : key),
  )
}

describe('messages', () => {
  it('has a messages file for every configured locale', () => {
    expect(Object.keys(MESSAGES).sort()).toEqual([...routing.locales].sort())
  })

  const sourceKeys = flattenKeys(en).sort()

  it.each(routing.locales.filter((locale) => locale !== routing.defaultLocale))(
    '%s has the same keys as en',
    (locale) => {
      expect(flattenKeys(MESSAGES[locale]).sort()).toEqual(sourceKeys)
    },
  )

  it.each(routing.locales)('%s has no empty messages', (locale) => {
    const empty = flattenKeys(MESSAGES[locale]).filter((key) => {
      const value = key.split('.').reduce<unknown>((node, part) => {
        return (node as Record<string, unknown>)[part]
      }, MESSAGES[locale])
      return typeof value === 'string' && value.trim() === ''
    })
    expect(empty).toEqual([])
  })
})
