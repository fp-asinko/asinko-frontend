// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { isMalformedPath } from './malformed-path'

describe('isMalformedPath', () => {
  it('rejects a lone % and one that comes out of %25', () => {
    expect(isMalformedPath('/%zz')).toBe(true)
    expect(isMalformedPath('/en/hub/macro%25zz')).toBe(true)
    expect(isMalformedPath('/en/user/a%25')).toBe(true)
  })

  it('accepts plain and well-encoded paths', () => {
    expect(isMalformedPath('/en/hub/macro')).toBe(false)
    expect(isMalformedPath('/es/hub/ma%C3%B1ana')).toBe(false)
    expect(isMalformedPath('/en/asset/XAU%2FUSD')).toBe(false)
    expect(isMalformedPath('/en/asset/BRK.B')).toBe(false)
  })
})
