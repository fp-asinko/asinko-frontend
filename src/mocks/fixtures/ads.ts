import type { RawAd } from '@/lib/api/contract'
import { mockId } from './ids'

// P-031 (proposal, specs/ads): ads as the backend would send them. The pieces live in
// public/mocks/ads/; they exist only with the mocks, never in production (API_MOCKS).

const piece = (file: string, width: number, height: number, alt: string) => ({
  url: `/mocks/ads/${file}`,
  width,
  height,
  alt,
})

export const ADS: RawAd[] = [
  {
    id: mockId(31, 1),
    advertiser: { name: 'AvaTrade', logoUrl: null },
    body: null,
    url: 'https://www.avatrade.com/trading-info/indices',
    image: piece(
      'avatrade-indices.jpg',
      1200,
      1500,
      'Indices trading built for beginners: Nikkei, S&P 500, FTSE 100, Dow Jones. Start with confidence.',
    ),
  },
  {
    id: mockId(31, 2),
    advertiser: { name: 'Pepperstone', logoUrl: null },
    body: null,
    url: 'https://pepperstone.com/en-au/',
    image: piece(
      'pepperstone-best-broker.jpg',
      970,
      250,
      "Australia's best FX and CFD broker. Switch to Pepperstone. Trade now.",
    ),
  },
  {
    id: mockId(31, 3),
    advertiser: { name: 'eToro', logoUrl: null },
    body: 'Stocks and ETFs with 0% commission. Your capital is at risk.',
    url: 'https://www.etoro.com/',
    image: piece(
      'etoro-commission.jpg',
      1080,
      1080,
      '0% commission. Go on, find the catch. Start from £50.',
    ),
  },
  {
    id: mockId(31, 4),
    advertiser: { name: 'AvaTrade', logoUrl: null },
    body: null,
    url: 'https://www.avatrade.com/forex',
    image: piece(
      'avatrade-forex.jpg',
      1200,
      628,
      'Forex made simple, for first-time traders. Start trading in minutes.',
    ),
  },
  {
    id: mockId(31, 5),
    advertiser: { name: 'Pepperstone', logoUrl: null },
    body: null,
    url: 'https://pepperstone.com/en-au/',
    image: piece(
      'pepperstone-execution.jpg',
      970,
      250,
      'Voted #1 for quality of trade execution. Switch to Pepperstone.',
    ),
  },
  {
    id: mockId(31, 6),
    advertiser: { name: 'eToro', logoUrl: null },
    body: null,
    url: 'https://www.etoro.com/crypto/',
    image: piece(
      'etoro-crypto.jpg',
      480,
      320,
      'Buy crypto on a trusted platform. Transparent, fixed, unified fees. Join 30M users.',
    ),
  },
]

/** One ad after every this many items or comments, where the backend would put them. */
export const AD_EVERY = 10

/** The ad for a place, in turn: a page shows different ones. */
export const adAt = (place: number): RawAd => ADS[place % ADS.length]!
