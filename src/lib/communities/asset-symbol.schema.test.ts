// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { assetSymbolSchema } from './asset-symbol.schema'

describe('assetSymbolSchema (specs/backend-answer-1013 BA-08)', () => {
  it('takes the catalog symbols, with "." "/" and "-" inside', () => {
    for (const symbol of ['BTC', 'brk.b', 'BRK.B', 'XAU/USD', 'SQM-B', 'EURUSD']) {
      expect(assetSymbolSchema.safeParse(symbol).success, symbol).toBe(true)
    }
  })

  it('refuses what is not a symbol before the network', () => {
    for (const symbol of ['', '../x', '/BTC', '.B', 'a b', 'A'.repeat(33), '%2F']) {
      expect(assetSymbolSchema.safeParse(symbol).success, symbol).toBe(false)
    }
  })
})
