// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { submitPath } from './submit-path'

describe('submitPath (specs/submit-page SU-01)', () => {
  it("goes to the page of the locale's word", () => {
    expect(submitPath('en')).toBe('/submit')
    expect(submitPath('es')).toBe('/publicar')
    expect(submitPath('pt')).toBe('/publicar')
  })

  it('carries the community and the format, encoded; text is the default and goes without', () => {
    expect(submitPath('es', { community: 'defi', type: 'link' })).toBe(
      '/publicar?community=defi&type=link',
    )
    expect(submitPath('en', { community: 'XAU/USD', type: 'text' })).toBe(
      '/submit?community=XAU%2FUSD',
    )
    expect(submitPath('en', { community: null })).toBe('/submit')
  })

  it('carries the related ones as slugs, comma separated (specs/related-aside RA-04)', () => {
    expect(submitPath('en', { community: 'defi', related: ['BTC', 'macro'] })).toBe(
      '/submit?community=defi&related=BTC%2Cmacro',
    )
    expect(submitPath('en', { community: 'defi', related: [] })).toBe('/submit?community=defi')
  })
})
