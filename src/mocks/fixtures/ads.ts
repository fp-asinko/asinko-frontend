import type { RawAd } from '@/lib/api/contract'
import { mockId } from './ids'

// P-015: house ads of Asinko, and two sample advertisers, invented and named as samples (PO,
// specs/post-detail-refresh Q2). Links go to example.com: reserved, never a real site.
export const ADS: RawAd[] = [
  {
    id: mockId(8, 1),
    advertiser: { name: 'Asinko', logoUrl: null },
    body: 'Think $BTC breaks 150k this year? Publish your first thesis and let the market grade it.',
    url: 'https://example.com/asinko/theses',
    imageUrl: '/mocks/ad-thesis.svg',
  },
  {
    id: mockId(8, 2),
    advertiser: { name: 'Northwind Ledger (sample)', logoUrl: null },
    body: 'Your keys, offline. A hardware wallet with a screen you can trust. Sample ad for testing.',
    url: 'https://example.com/northwind-ledger',
    imageUrl: '/mocks/ad-wallet.svg',
  },
  {
    id: mockId(8, 3),
    advertiser: { name: 'Asinko', logoUrl: null },
    body: 'Invite a friend who calls the market right. Their track record is public from day one.',
    url: 'https://example.com/asinko/invite',
    imageUrl: null,
  },
  {
    id: mockId(8, 4),
    advertiser: { name: 'Meridian Data (sample)', logoUrl: null },
    body: 'On-chain flows for every asset you follow, in one dashboard. Sample ad for testing.',
    url: 'https://example.com/meridian-data',
    imageUrl: null,
  },
]
