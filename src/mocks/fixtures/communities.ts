import type { RawCommunity, RawCommunitySummary } from '@/lib/api/contract'
import { assetBySymbol } from './assets'
import { daysAgo, mockId } from './ids'
import { userByUsername } from './users'

type Seed = Pick<RawCommunity, 'slug' | 'name' | 'description' | 'type' | 'memberCount'> &
  Partial<RawCommunity>

function community(n: number, seed: Seed): RawCommunity {
  return {
    id: mockId(2, n),
    slugChangedAt: null,
    avatarUrl: null,
    bannerUrl: null,
    assetId: null,
    mainUrl: null,
    rules: null,
    createdByProfileId: null,
    createdAt: daysAgo(200 - n * 10),
    viewerMembership: null,
    ...seed,
  }
}

function assetCommunity(n: number, symbol: string, memberCount: number, description: string) {
  const asset = assetBySymbol(symbol)
  return community(n, {
    slug: symbol.toLowerCase(),
    name: asset?.name ?? symbol,
    description,
    type: 'SYSTEM_ASSET',
    assetId: asset?.id ?? null,
    memberCount,
  })
}

// The demo user is a member of btc, eth, sol, link, avax, xrp, defi and latam, and moderates trading-on-chain
// (drives the Following feed and the "Your interests" column).
export const COMMUNITIES: RawCommunity[] = [
  {
    ...assetCommunity(
      1,
      'BTC',
      48210,
      'All things Bitcoin: on-chain, cycles, ETFs and the halving.',
    ),
    viewerMembership: 'MEMBER',
    mainUrl: 'https://bitcoin.org',
  },
  {
    ...assetCommunity(2, 'ETH', 31540, 'Ethereum, L2s, staking and the roadmap.'),
    viewerMembership: 'MEMBER',
  },
  {
    ...assetCommunity(3, 'SOL', 15320, 'Solana: memecoins, DePIN and speed.'),
    viewerMembership: 'MEMBER',
  },
  {
    ...assetCommunity(9, 'LINK', 6420, 'Chainlink: oracles, CCIP and staking.'),
    viewerMembership: 'MEMBER',
  },
  {
    ...assetCommunity(10, 'AVAX', 5180, 'Avalanche: subnets and institutional RWAs.'),
    viewerMembership: 'MEMBER',
  },
  {
    ...assetCommunity(11, 'XRP', 8930, 'XRP: payments, the ledger and the ETF race.'),
    viewerMembership: 'MEMBER',
  },
  {
    ...community(4, {
      slug: 'defi',
      name: 'DeFi',
      description: 'Protocols, yields and risks of decentralized finance.',
      type: 'SYSTEM_CATEGORY',
      memberCount: 12880,
      rules: '1. No shilling your own tokens.\n2. Cite the source of on-chain data.',
    }),
    viewerMembership: 'MEMBER',
  },
  community(5, {
    slug: 'macro',
    name: 'Macro',
    description: 'Rates, global liquidity and how they move crypto.',
    type: 'SYSTEM_CATEGORY',
    memberCount: 9640,
  }),
  community(6, {
    slug: 'memecoins',
    name: 'Memecoins',
    description: 'DOGE, frogs and dogs with hats. Enter at your own risk.',
    type: 'SYSTEM_CATEGORY',
    memberCount: 22150,
  }),
  {
    ...community(7, {
      slug: 'latam',
      name: 'LATAM',
      description: 'Crypto in Latin America: regulation, adoption and local exchanges.',
      type: 'SYSTEM_GEO',
      memberCount: 7310,
    }),
    viewerMembership: 'MEMBER',
  },
  community(8, {
    slug: 'trading-on-chain',
    name: 'Trading on-chain',
    description: 'Flows of wallets, exchanges and whales.',
    type: 'USER_PUBLIC',
    memberCount: 1204,
    createdByProfileId: userByUsername('maria')?.id ?? null,
    rules: 'Data or it did not happen. No paid signals.',
    // The demo user moderates it (shows the MOD label).
    viewerMembership: 'MODERATOR',
  }),
]

export function communityBySlug(slug: string) {
  return COMMUNITIES.find((each) => each.slug === slug)
}

/** The community summary every piece of content carries (P-004). */
export function communitySummary(slug: string): RawCommunitySummary {
  const community = communityBySlug(slug)
  if (!community) throw new Error(`Unknown mock community ${slug}`)
  const { id, name, type, avatarUrl, viewerMembership } = community
  // avatarUrl and viewerMembership: proposal P-010, the backend does not send them yet.
  return { id, slug, name, type, avatarUrl, viewerMembership }
}

export function communityById(id: string) {
  return COMMUNITIES.find((each) => each.id === id)
}
