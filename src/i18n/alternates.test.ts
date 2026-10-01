// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { buildAlternates, localizedUrl } from './alternates'

const SITE = 'https://asinko.example'

describe('alternates', () => {
  it('builds absolute localized URLs', () => {
    expect(localizedUrl(SITE, 'es', '/')).toBe('https://asinko.example/es')
  })

  it('uses a self-referencing canonical per locale', () => {
    expect(buildAlternates(SITE, 'pt', '/').canonical).toBe('https://asinko.example/pt')
  })

  it('lists every locale plus x-default pointing to en', () => {
    expect(buildAlternates(SITE, 'es', '/').languages).toEqual({
      en: 'https://asinko.example/en',
      es: 'https://asinko.example/es',
      pt: 'https://asinko.example/pt',
      'x-default': 'https://asinko.example/en',
    })
  })
})
