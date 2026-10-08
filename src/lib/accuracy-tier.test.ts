// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { accuracyTier } from './accuracy-tier'

describe('accuracyTier (FC-03)', () => {
  it.each([
    [0, 'low'],
    [0.4999, 'low'],
    [0.5, 'mid'],
    [0.6999, 'mid'],
    [0.7, 'high'],
    [1, 'high'],
  ] as const)('puts %s in the %s tier', (rate, tier) => {
    expect(accuracyTier(rate)).toBe(tier)
  })
})
