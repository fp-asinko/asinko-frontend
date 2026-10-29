// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { safeNext } from './next'

describe('safeNext (specs/auth AU-03, security.md § 5)', () => {
  it('keeps a path of this site, with its query', () => {
    expect(safeNext('/hub/macro?sort=new')).toBe('/hub/macro?sort=new')
    expect(safeNext('/es/user/maria')).toBe('/es/user/maria')
  })

  it.each([
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    'evil.example',
    'javascript:alert(1)',
    '/\tjavascript:alert(1)',
    '',
    undefined,
    ['/'],
  ])('goes home instead of %j', (next) => {
    expect(safeNext(next)).toBe('/')
  })

  it('takes another fallback', () => {
    expect(safeNext('//x', '/welcome')).toBe('/welcome')
  })
})
