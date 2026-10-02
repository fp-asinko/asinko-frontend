// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { countFormat } from './count-format'

const format = (locale: string, value: number) =>
  // Intl separates "12,4" and "mil" with a no-break space (U+00A0).
  new Intl.NumberFormat(locale, countFormat(value)).format(value).replace(/ /g, ' ')

describe('countFormat (design § 8)', () => {
  it('keeps counts under 10,000 in full, as the prototype', () => {
    expect(format('en', 2104)).toBe('2,104')
    expect(format('pt', 2104)).toBe('2.104')
  })

  it('makes 10,000 or more compact in each locale', () => {
    expect(format('en', 12_400)).toBe('12.4K')
    expect(format('es', 12_400)).toBe('12,4 mil')
    expect(format('pt', 12_400)).toBe('12,4 mil')
    expect(format('en', -15_000)).toBe('-15K')
  })
})
