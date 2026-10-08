import type { RawThesis } from '@/lib/api/contract'
import { assetBySymbol } from './assets'
import { communitySummary } from './communities'
import { daysAgo, mockId } from './ids'
import { summary, userByUsername } from './users'

// Theses for the profile's "Theses" tab (specs/profile-track-record PT-12). One of each state, and
// enough of @maria's to page (20 a page). The profiles' counters count all of a person's theses in
// the backend; these are a sample, so they do not add up to them.

type Seed = {
  author: string
  /** An asset's symbol, or null for a qualitative thesis (no target). */
  asset: string | null
  claim: string
  state: RawThesis['state']
  direction?: 'ABOVE' | 'BELOW' | 'EQUALS'
  target?: number
  conviction?: RawThesis['conviction']
  /** Days from now to the deadline: negative, already past. */
  deadlineIn: number
  publishedDaysAgo: number
  resolutionPrice?: number
  cancellationReason?: string
}

function thesis(n: number, seed: Seed): RawThesis {
  const author = userByUsername(seed.author)
  if (!author) throw new Error(`No mock user ${seed.author}`)
  const asset = seed.asset ? assetBySymbol(seed.asset) : null
  const community = communitySummary(seed.asset ?? seed.author)
  const resolved = ['CORRECT', 'INCORRECT', 'DISPUTED'].includes(seed.state)
  return {
    id: mockId(9, n),
    communityId: community.id,
    community,
    asset: asset ? { id: asset.id, symbol: asset.symbol, name: asset.name } : null,
    claim: seed.claim,
    reasoning: 'Flows, positioning and the macro calendar all point the same way.',
    conviction: seed.conviction ?? 'MEDIUM',
    deadline: daysAgo(-seed.deadlineIn),
    referencePrice: asset?.price ?? null,
    referencePriceAt: asset ? daysAgo(seed.publishedDaysAgo) : null,
    targetPrice: asset ? (seed.target ?? null) : null,
    targetDirection: asset ? (seed.direction ?? 'ABOVE') : null,
    state: seed.state,
    resolvedAt: resolved ? daysAgo(-seed.deadlineIn) : null,
    resolutionPrice: resolved ? (seed.resolutionPrice ?? null) : null,
    resolutionSource: resolved ? 'AUTOMATIC' : null,
    cancelledAt: seed.state === 'CANCELLED' ? daysAgo(seed.publishedDaysAgo - 1) : null,
    cancellationReason: seed.cancellationReason ?? null,
    disclaimerAcceptedAt: daysAgo(seed.publishedDaysAgo),
    creator: summary(seed.author),
    creatorType: 'USER',
    score: 40 - n,
    viewerVote: null,
    argumentCounts: { pro: 3, contra: 1 },
    canCancel: false,
    publishedAt: daysAgo(seed.publishedDaysAgo),
    createdAt: daysAgo(seed.publishedDaysAgo),
  }
}

const MARIA: Seed[] = [
  {
    author: 'maria',
    asset: 'BTC',
    claim: 'BTC will close above $150K before December 2026',
    state: 'OPEN',
    target: 150000,
    conviction: 'HIGH',
    deadlineIn: 84,
    publishedDaysAgo: 2,
  },
  {
    author: 'maria',
    asset: 'ETH',
    claim: 'ETH/BTC bottoms this quarter: ETH above $4,000 by November',
    state: 'OPEN',
    target: 4000,
    deadlineIn: 40,
    publishedDaysAgo: 6,
  },
  {
    author: 'maria',
    asset: 'SOL',
    claim: 'SOL holds above $150 through the October unlocks',
    state: 'CORRECT',
    target: 150,
    conviction: 'EXTREME',
    deadlineIn: -3,
    publishedDaysAgo: 30,
    resolutionPrice: 182.47,
  },
  {
    author: 'maria',
    asset: 'XRP',
    claim: 'XRP drops below $2 after the ETF delay',
    state: 'INCORRECT',
    direction: 'BELOW',
    target: 2,
    conviction: 'LOW',
    deadlineIn: -8,
    publishedDaysAgo: 40,
    resolutionPrice: 2.41,
  },
  {
    author: 'maria',
    asset: 'BTC',
    claim: 'BTC dominance above 60% by the end of September',
    state: 'DISPUTED',
    target: 60,
    deadlineIn: -7,
    publishedDaysAgo: 50,
    resolutionPrice: 59.8,
  },
  {
    author: 'maria',
    asset: 'ETH',
    claim: 'ETH flips $3,000 into support before the merge anniversary',
    state: 'EXPIRED',
    target: 3000,
    deadlineIn: -20,
    publishedDaysAgo: 60,
  },
  {
    author: 'maria',
    asset: null,
    claim: 'The Fed cuts twice more before the year ends',
    state: 'CANCELLED',
    deadlineIn: 70,
    publishedDaysAgo: 9,
    cancellationReason: 'Posted twice by mistake.',
  },
  // Older, resolved: enough to page.
  ...Array.from({ length: 17 }, (_, index): Seed => {
    const right = index % 3 !== 2
    return {
      author: 'maria',
      asset: index % 2 === 0 ? 'BTC' : 'ETH',
      claim: `${index % 2 === 0 ? 'BTC' : 'ETH'} weekly close call #${17 - index}`,
      state: right ? 'CORRECT' : 'INCORRECT',
      target: index % 2 === 0 ? 90000 + index * 1000 : 3000 + index * 50,
      deadlineIn: -30 - index * 7,
      publishedDaysAgo: 70 + index * 7,
      resolutionPrice: index % 2 === 0 ? 95000 + index * 500 : 3100 + index * 40,
    }
  }),
]

const FEDERICO: Seed[] = [
  {
    author: 'federico',
    asset: 'BTC',
    claim: 'BTC retests $90K before any new high',
    state: 'OPEN',
    direction: 'BELOW',
    target: 90000,
    conviction: 'MEDIUM',
    deadlineIn: 30,
    publishedDaysAgo: 1,
  },
  {
    author: 'federico',
    asset: 'ETH',
    claim: 'ETH above $3,200 after the Fed decision',
    state: 'CORRECT',
    target: 3200,
    conviction: 'HIGH',
    deadlineIn: -2,
    publishedDaysAgo: 14,
    resolutionPrice: 3420.55,
  },
]

export const THESES: RawThesis[] = [...MARIA, ...FEDERICO].map((seed, index) =>
  thesis(index + 1, seed),
)

/** A person's theses, the newest first (E12). */
export function thesesBy(userId: string): RawThesis[] {
  return THESES.filter((each) => each.creator?.id === userId).sort(
    (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
  )
}
