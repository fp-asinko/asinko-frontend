// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { COUNTRY_CODES, countryName, countryOptions } from './countries'

describe('countries (specs/profile-presentation PP-05)', () => {
  it('lists countries by their ISO code, without unions or old codes', () => {
    expect(COUNTRY_CODES).toEqual(expect.arrayContaining(['AR', 'BR', 'CL', 'US', 'ES', 'XK']))
    for (const notACountry of ['EU', 'UN', 'SU', 'ZZ', 'XA']) {
      expect(COUNTRY_CODES).not.toContain(notACountry)
    }
    expect(new Set(COUNTRY_CODES).size).toBe(COUNTRY_CODES.length)
  })

  it("names each country in the page's language, and nothing for an unknown code", () => {
    expect(countryName('BR', 'es')).toBe('Brasil')
    expect(countryName('DE', 'pt')).toBe('Alemanha')
    expect(countryName('US', 'en')).toBe('United States')
    expect(countryName('QQ', 'en')).toBeNull()
    expect(countryName(null, 'en')).toBeNull()
  })

  it("orders the options alphabetically in the page's language", () => {
    const names = countryOptions('es').map((each) => each.name)
    expect(names.indexOf('Alemania')).toBeLessThan(names.indexOf('Brasil'))
    expect(names).toEqual([...names].sort(new Intl.Collator('es').compare))
  })
})
