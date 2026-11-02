import type { RawThesis } from '@/lib/api/contract'
import { mockCaller } from './auth'
import { assetBySymbol } from './fixtures/assets'
import { communityById, communitySummary } from './fixtures/communities'
import { mockId } from './fixtures/ids'
import { THESES } from './fixtures/theses'
import { PROFILES, summary } from './fixtures/users'
import type { MockContext, MockResponse } from './types'

// POST /api/v1/theses (E11) as the backend does it (asinko-app app/api/v1/theses/route.ts):
// specs/thesis-create § 9.

const CLAIM_MAX = 280
const DAY_MS = 24 * 60 * 60 * 1000
const CONVICTIONS = ['LOW', 'MEDIUM', 'HIGH', 'EXTREME']
const DIRECTIONS = ['ABOVE', 'BELOW', 'EQUALS']

const error = (status: number, code: string): MockResponse => ({
  status,
  body: { error: { code, message: code } },
})

const text = (value: unknown) => (typeof value === 'string' && value.trim() ? value : null)

let created = 0

/** Validates in the backend's order, and the new thesis goes first in its author's. */
export function createMockThesis({ body, accessToken }: MockContext): MockResponse {
  const caller = mockCaller(accessToken)
  const input = (body ?? {}) as Record<string, unknown>
  if (typeof input.userId !== 'string') return error(400, 'BAD_REQUEST')
  if (input.userId !== caller) return error(403, 'USER_MISMATCH')
  const author = PROFILES.find((each) => each.id === caller)
  if (!author) return error(403, 'PROFILE_REQUIRED')

  const community = communityById(String(input.communityId))
  if (!community) return error(422, 'INVALID_COMMUNITY')
  if (community.type === 'PERSONAL_CHANNEL' && community.slug !== author.username) {
    return error(403, 'PERSONAL_CHANNEL_OWNER_ONLY')
  }
  const asset = typeof input.assetSymbol === 'string' ? assetBySymbol(input.assetSymbol) : null
  if (!asset) return error(404, 'ASSET_NOT_FOUND')

  const claim = text(input.claim)
  if (!claim) return error(422, 'VALIDATION_ERROR')
  if (claim.length > CLAIM_MAX) return error(422, 'CLAIM_TOO_LONG')
  const reasoning = text(input.reasoning)
  if (!reasoning) return error(422, 'VALIDATION_ERROR')
  if (!CONVICTIONS.includes(String(input.conviction))) return error(422, 'VALIDATION_ERROR')
  if (!DIRECTIONS.includes(String(input.targetDirection))) return error(422, 'VALIDATION_ERROR')
  if (typeof input.targetPrice !== 'number' || !Number.isFinite(input.targetPrice)) {
    return error(422, 'VALIDATION_ERROR')
  }
  if (input.disclaimerAccepted !== true) return error(422, 'DISCLAIMER_NOT_ACCEPTED')

  const now = Date.now()
  const deadline = typeof input.deadline === 'string' ? Date.parse(input.deadline) : NaN
  const delta = deadline - now
  if (Number.isNaN(deadline) || delta < DAY_MS || delta > 5 * 365 * DAY_MS) {
    return error(422, 'DEADLINE_OUT_OF_RANGE')
  }

  created += 1
  const at = new Date(now).toISOString()
  const thesis: RawThesis = {
    id: mockId(41, created),
    communityId: community.id,
    community: communitySummary(community.slug),
    asset: { id: asset.id, symbol: asset.symbol, name: asset.name },
    claim,
    reasoning,
    conviction: input.conviction as RawThesis['conviction'],
    deadline: new Date(deadline).toISOString(),
    // E14-02: the backend takes it at creation; here, the fixture's.
    referencePrice: asset.price,
    referencePriceAt: asset.price === null ? null : at,
    targetPrice: input.targetPrice,
    targetDirection: input.targetDirection as RawThesis['targetDirection'],
    state: 'OPEN',
    resolvedAt: null,
    resolutionPrice: null,
    resolutionSource: null,
    cancelledAt: null,
    cancellationReason: null,
    disclaimerAcceptedAt: at,
    creator: summary(author.username),
    creatorType: 'USER',
    score: 0,
    viewerVote: null,
    argumentCounts: { pro: 0, contra: 0 },
    canCancel: true,
    publishedAt: at,
    createdAt: at,
  }
  // The profile's tab lists the newest first (thesesBy): it shows first.
  THESES.unshift(thesis)
  return { status: 201, body: thesis }
}
