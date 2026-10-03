// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { IDENTITY_COLORS, identityIndex } from './identity-color'

describe('identityIndex', () => {
  it('is stable for the same handle', () => {
    expect(identityIndex('quantsimula')).toBe(identityIndex('quantsimula'))
    expect(identityIndex('quantsimula')).toBe(1)
    expect(identityIndex('macro')).toBe(3)
    expect(identityIndex('defi')).toBe(7)
  })

  it('ignores the mention prefix and the case', () => {
    expect(identityIndex('#DeFi')).toBe(identityIndex('defi'))
    expect(identityIndex('@QuantSimula')).toBe(identityIndex('quantsimula'))
  })

  it('always returns a slot of the palette, also for an empty key', () => {
    for (const key of ['', '?', '$btc', 'ñandú', '🚀']) {
      const index = identityIndex(key)
      expect(index).toBeGreaterThanOrEqual(0)
      expect(index).toBeLessThan(IDENTITY_COLORS)
    }
  })

  it('spreads a sample of handles over most of the palette', () => {
    const handles = ['maria', 'juan', 'quantsimula', 'macro', 'defi', 'btc', 'eth', 'solana', 'fed']
    const slots = new Set(
      [...handles, 'onchain', 'options', 'ai', 'stocks', 'alpha'].map(identityIndex),
    )
    expect(slots.size).toBeGreaterThanOrEqual(6)
  })
})
