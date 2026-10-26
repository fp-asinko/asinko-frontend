// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { plainHandle } from './plain-handle'

describe('plainHandle', () => {
  it('drops the symbol of a group, a person and an asset, only the first one', () => {
    expect(plainHandle('#macro')).toBe('macro')
    expect(plainHandle('@maria')).toBe('maria')
    expect(plainHandle('$XAU/USD')).toBe('XAU/USD')
    expect(plainHandle('macro')).toBe('macro')
    expect(plainHandle('##x')).toBe('#x')
  })
})
