import { assetBySymbol } from './fixtures/assets'
import { anchorOf } from './thesis-identity'
import type { MockContext, MockResponse } from './types'

// P-046 (proposal, specs/thesis-chart): an asset's price history. A random walk, the same on every
// request for the same symbol and dates, bridged between where a seen thesis began and where it is
// today (thesis-identity.ts), so the chart ends where the ticket's bar says.

const HOUR = 3_600_000
const DAY = 86_400_000

/** A small seeded generator (mulberry32): the same walk every time. */
function seeded(seed: string) {
  let state = 0
  for (const char of seed) state = (state * 31 + char.charCodeAt(0)) >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** GET /api/v1/assets/{symbol}/prices?from=&to=: daily, or hourly under a week; up to today. */
export function mockAssetPrices({ params, query }: MockContext): MockResponse {
  const symbol = (params.symbol ?? '').toUpperCase()
  const from = Date.parse(String(query.from ?? ''))
  const to = Math.min(Date.parse(String(query.to ?? '')), Date.now())
  if (Number.isNaN(from) || Number.isNaN(to) || from >= to) {
    return { status: 422, body: { error: { code: 'VALIDATION_ERROR', message: 'range' } } }
  }
  const fixture = assetBySymbol(symbol)?.price ?? null
  const anchor = anchorOf(symbol, String(query.from))
  const start = anchor?.start ?? fixture ?? 100
  const random = seeded(`${symbol}|${query.from}`)
  const end = anchor?.end ?? start * (0.9 + random() * 0.25)

  // Up to 200 points, an hour apart at least: hourly while they fit under a day apart (P-046).
  const step = Math.max(HOUR, (to - from) / 199)
  const hourly = step < DAY
  const count = Math.max(2, Math.min(200, Math.floor((to - from) / step) + 1))
  const gap = (to - from) / (count - 1)

  // A walk in log space with the asset's own volatility (crypto moves 3.5 % a day, the rest 1.5 %),
  // bridged so it starts at `start` and ends at `end` (PO, 2026-11-06: more like a real one).
  const daily =
    assetBySymbol(symbol)?.assetClass === 'CRYPTO' || !assetBySymbol(symbol) ? 0.035 : 0.015
  const sigma = daily * Math.sqrt(gap / DAY)
  // About normal: three uniforms, centered and scaled to a standard deviation of 1.
  const normal = () => (random() + random() + random() - 1.5) / 0.5
  const walk = [0]
  for (let i = 1; i < count; i++) walk.push(walk[i - 1]! + sigma * normal())
  const last = walk[count - 1]!
  const drift = Math.log(end / start)
  const items = walk.map((value, i) => {
    const t = i / (count - 1)
    const price = start * Math.exp(drift * t + (value - last * t))
    return { at: new Date(from + gap * i).toISOString(), price: Math.round(price * 100) / 100 }
  })
  return { status: 200, body: { symbol, interval: hourly ? 'HOUR' : 'DAY', items } }
}
