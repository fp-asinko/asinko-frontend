// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { priceHistorySchema } from '@/lib/api/contract'
import { mockAssetPrices } from './asset-prices'
import { THESES } from './fixtures/theses'
import { todayPriceOf, withIdentity } from './thesis-identity'
import type { MockContext } from './types'

const ask = (symbol: string, from: string, to: string) =>
  mockAssetPrices({ params: { symbol }, query: { from, to } } as unknown as MockContext)

type History = { interval: string; items: { at: string; price: number }[] }

describe('price history mock (P-046, specs/thesis-chart)', () => {
  it('walks in up to 200 points, the same every time, in the contract’s shape', () => {
    const first = ask('BTC', '2026-10-01T00:00:00.000Z', '2026-10-31T00:00:00.000Z')
    expect(first.status).toBe(200)
    expect(priceHistorySchema.parse(first.body)).toBeTruthy()
    const body = first.body as History
    // A month in up to 200 points: hours apart (P-046).
    expect(body.interval).toBe('HOUR')
    expect(body.items).toHaveLength(200)
    expect(ask('BTC', '2026-10-01T00:00:00.000Z', '2026-10-31T00:00:00.000Z').body).toEqual(body)
  })

  it('goes hourly under a week, and never past today', () => {
    const now = Date.now()
    const body = ask(
      'ETH',
      new Date(now - 2 * 86_400_000).toISOString(),
      new Date(now + 9e9).toISOString(),
    ).body as History
    expect(body.interval).toBe('HOUR')
    expect(Date.parse(body.items.at(-1)!.at)).toBeLessThanOrEqual(now + 1000)
  })

  it('starts at a seen thesis’s entry and ends at its price today', () => {
    const thesis = THESES.find((each) => each.state === 'OPEN' && todayPriceOf(each) !== null)!
    withIdentity(thesis)
    const body = ask(thesis.asset!.symbol, thesis.referencePriceAt!, new Date().toISOString())
      .body as History
    expect(body.items[0]!.price).toBeCloseTo(thesis.referencePrice!, 0)
    expect(body.items.at(-1)!.price).toBeCloseTo(todayPriceOf(thesis)!, 0)
  })

  it('refuses a range backwards', () => {
    expect(ask('BTC', '2026-10-31T00:00:00.000Z', '2026-10-01T00:00:00.000Z').status).toBe(422)
  })
})
