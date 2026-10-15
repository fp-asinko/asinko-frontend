import type { RawAsset } from '@/lib/api/contract'
import { minutesAgo, mockId } from './ids'

type Seed = Pick<RawAsset, 'symbol' | 'name' | 'price' | 'priceChangePct'> & {
  bullishPct: number
  totalVotes: number
  stale?: boolean
}

function crypto(n: number, seed: Seed): RawAsset {
  return {
    id: mockId(3, n),
    symbol: seed.symbol,
    exchange: null,
    name: seed.name,
    assetClass: 'CRYPTO',
    price: seed.price,
    priceChangePct: seed.priceChangePct,
    // A stale price keeps the last known value: the UI should say so.
    priceUpdatedAt: minutesAgo(seed.stale ? 95 : 1),
    priceStale: seed.stale ?? false,
    sentiment: {
      bullishPct: seed.bullishPct,
      bearishPct: Math.round((100 - seed.bullishPct) * 10) / 10,
      totalVotes: seed.totalVotes,
    },
    viewerSentiment: null,
  }
}

/** An asset of another class (backend 2026-10-13: stocks, ETFs, commodities…), no community. */
function other(n: number, seed: Seed & Pick<RawAsset, 'assetClass' | 'exchange'>): RawAsset {
  return { ...crypto(n, seed), assetClass: seed.assetClass, exchange: seed.exchange }
}

// The catalog's crypto (prices fictional), and three of the other classes, with "." and "/" in
// their symbols and no community yet (specs/backend-answer-1013 BA-08, BA-09).
export const ASSETS: RawAsset[] = [
  crypto(1, {
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 97430.12,
    priceChangePct: 2.14,
    bullishPct: 71.2,
    totalVotes: 4821,
  }),
  crypto(2, {
    symbol: 'ETH',
    name: 'Ethereum',
    price: 3420.55,
    priceChangePct: 1.24,
    bullishPct: 63.5,
    totalVotes: 2930,
  }),
  crypto(3, {
    symbol: 'SOL',
    name: 'Solana',
    price: 182.47,
    priceChangePct: -3.82,
    bullishPct: 58.1,
    totalVotes: 1544,
  }),
  crypto(4, {
    symbol: 'XRP',
    name: 'XRP',
    price: 2.4113,
    priceChangePct: 0.41,
    bullishPct: 49.7,
    totalVotes: 980,
  }),
  crypto(5, {
    symbol: 'ADA',
    name: 'Cardano',
    price: 0.7812,
    priceChangePct: -1.05,
    bullishPct: 44.3,
    totalVotes: 611,
  }),
  crypto(6, {
    symbol: 'DOGE',
    name: 'Dogecoin',
    price: 0.2105,
    priceChangePct: 8.22,
    bullishPct: 66.0,
    totalVotes: 2210,
  }),
  crypto(7, {
    symbol: 'LINK',
    name: 'Chainlink',
    price: 18.93,
    priceChangePct: 0.0,
    bullishPct: 55.4,
    totalVotes: 402,
  }),
  crypto(8, {
    symbol: 'AVAX',
    name: 'Avalanche',
    price: 34.21,
    priceChangePct: -0.62,
    bullishPct: 51.0,
    totalVotes: 288,
    stale: true,
  }),
  other(20, {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    assetClass: 'EQUITY',
    exchange: 'XNAS',
    price: 376.43,
    priceChangePct: 1.2,
    bullishPct: 52,
    totalVotes: 140,
    stale: true,
  }),
  other(21, {
    symbol: 'BRK.B',
    name: 'Berkshire Hathaway Inc. Class B',
    assetClass: 'EQUITY',
    exchange: 'XNYS',
    price: 471.2,
    priceChangePct: -0.3,
    bullishPct: 61,
    totalVotes: 35,
    stale: true,
  }),
  other(22, {
    symbol: 'XAU/USD',
    name: 'Gold Spot / US Dollar',
    assetClass: 'COMMODITY',
    exchange: null,
    price: null,
    priceChangePct: null,
    bullishPct: 50,
    totalVotes: 0,
    stale: true,
  }),
]

export function assetBySymbol(symbol: string) {
  return ASSETS.find((each) => each.symbol === symbol.toUpperCase())
}
