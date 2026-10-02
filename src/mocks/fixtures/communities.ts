import type { RawCommunity } from '@/lib/api/contract'
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

// The demo user is a member of btc, eth, sol, defi and latam, and moderates trading-on-chain
// (drives the Following feed and the "Your interests" column).
export const COMMUNITIES: RawCommunity[] = [
  {
    ...assetCommunity(1, 'BTC', 48210, 'Todo sobre Bitcoin: on-chain, ciclos, ETFs y halving.'),
    viewerMembership: 'MEMBER',
    mainUrl: 'https://bitcoin.org',
  },
  {
    ...assetCommunity(2, 'ETH', 31540, 'Ethereum, L2s, staking y el roadmap.'),
    viewerMembership: 'MEMBER',
  },
  {
    ...assetCommunity(3, 'SOL', 15320, 'Solana: memecoins, DePIN y velocidad.'),
    viewerMembership: 'MEMBER',
  },
  {
    ...community(4, {
      slug: 'defi',
      name: 'DeFi',
      description: 'Protocolos, rendimientos y riesgos de las finanzas descentralizadas.',
      type: 'SYSTEM_CATEGORY',
      memberCount: 12880,
      rules: '1. Sin shilling de tokens propios.\n2. Citá la fuente de los datos on-chain.',
    }),
    viewerMembership: 'MEMBER',
  },
  community(5, {
    slug: 'macro',
    name: 'Macro',
    description: 'Tasas, liquidez global y cómo mueven al mercado cripto.',
    type: 'SYSTEM_CATEGORY',
    memberCount: 9640,
  }),
  community(6, {
    slug: 'memecoins',
    name: 'Memecoins',
    description: 'DOGE, ranas y perros con gorro. Entrá bajo tu propio riesgo.',
    type: 'SYSTEM_CATEGORY',
    memberCount: 22150,
  }),
  {
    ...community(7, {
      slug: 'latam',
      name: 'LATAM',
      description: 'Cripto en Latinoamérica: regulación, adopción y exchanges locales.',
      type: 'SYSTEM_GEO',
      memberCount: 7310,
    }),
    viewerMembership: 'MEMBER',
  },
  community(8, {
    slug: 'trading-on-chain',
    name: 'Trading on-chain',
    description: 'Análisis de flujos de wallets, exchanges y ballenas.',
    type: 'USER_PUBLIC',
    memberCount: 1204,
    createdByProfileId: userByUsername('maria')?.id ?? null,
    rules: 'Datos o no pasó. Sin señales pagas.',
    // The demo user moderates it (shows the MOD label).
    viewerMembership: 'MODERATOR',
  }),
]

export function communityBySlug(slug: string) {
  return COMMUNITIES.find((each) => each.slug === slug)
}

export function communityById(id: string) {
  return COMMUNITIES.find((each) => each.id === id)
}
