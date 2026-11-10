import type {
  RawCommunity,
  RawCommunitySummary,
  RawThesis,
  RawThesisUpdate,
} from '@/lib/api/contract'
import { mockCaller } from './auth'
import { assetBySymbol } from './fixtures/assets'
import { communityById, communityBySlug, communitySummary } from './fixtures/communities'
import { MOCK_NOW, mockId } from './fixtures/ids'
import { THESES } from './fixtures/theses'
import { withAgreement } from './thesis-agreement'
import { withIdentity } from './thesis-identity'
import { takeThesisDraft } from './thesis-drafts'
import { PROFILES, summary } from './fixtures/users'
import { commentsOf } from './posting'
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
  // P-038: published from a draft, it goes in the same operation; someone else's or gone, 404.
  if (input.draftId !== undefined && !takeThesisDraft(String(input.draftId), caller)) {
    return error(404, 'NOT_FOUND')
  }

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

/**
 * Whether its author can still cancel it (E11): open, and not in the last 10 % of the window from
 * publishing to the deadline. Only for the caller who wrote it.
 */
function cancellable(thesis: RawThesis, caller: string, now = Date.now()) {
  if (thesis.state !== 'OPEN' || thesis.creator?.id !== caller) return false
  const published = Date.parse(thesis.publishedAt)
  const deadline = Date.parse(thesis.deadline)
  return now < deadline - (deadline - published) * 0.1
}

/**
 * Its arguments' counters, from its comments (specs/thesis-arguments TA-15): the first level of
 * each side, written with mocks included. Without any, the fixture's.
 */
function argumentsOf(thesis: RawThesis): RawThesis['argumentCounts'] {
  const roots = commentsOf(thesis.id)
  if (roots.length === 0) return thesis.argumentCounts
  return {
    pro: roots.filter((each) => each.side === 'PRO').length,
    contra: roots.filter((each) => each.side === 'CONTRA').length,
  }
}

/**
 * A thesis as the caller sees it: `canCancel` is theirs (specs/thesis-detail TD-12), and so is its
 * "Do you agree?" (P-043, specs/thesis-agree). With today's price and its author's count (P-044,
 * P-045, specs/thesis-identity).
 */
export function asSeenBy(thesis: RawThesis, accessToken: string | null | undefined): RawThesis {
  return withAgreement(
    withIdentity({
      ...thesis,
      canCancel: cancellable(thesis, mockCaller(accessToken)),
      argumentCounts: argumentsOf(thesis),
    }),
    accessToken,
  )
}

/** Updates by thesis, newest last as written: GET sorts them (specs/thesis-arguments § 8). */
const UPDATES: Record<string, RawThesisUpdate[]> = {}
let updates = 0

/** One of Maria's open thesis, so the section shows with mocks. */
{
  const open = THESES[0]!
  UPDATES[open.id] = [
    {
      id: mockId(42, 0),
      body: 'ETF inflows held this week too. **Keeping the target.**',
      createdAt: new Date(Date.parse(open.publishedAt) + 24 * 60 * 60 * 1000).toISOString(),
      author: { id: open.creator!.id, username: open.creator!.username, avatarUrl: null },
    },
  ]
}

/** GET /api/v1/theses/{id}/updates (E11): `{ items }`, as the backend answers (Q6). */
export function listMockThesisUpdates({ params }: MockContext): MockResponse {
  if (!THESES.some((each) => each.id === params.id)) return error(404, 'NOT_FOUND')
  return { status: 200, body: { items: [...(UPDATES[params.id ?? ''] ?? [])] } }
}

/** POST /api/v1/theses/{id}/updates (E11): only its author, while it is open. */
export function createMockThesisUpdate({ params, body, accessToken }: MockContext): MockResponse {
  const thesis = THESES.find((each) => each.id === params.id)
  if (!thesis) return error(404, 'NOT_FOUND')
  const caller = mockCaller(accessToken)
  const input = (body ?? {}) as Record<string, unknown>
  if (input.userId !== caller || thesis.creator?.id !== caller) return error(403, 'USER_MISMATCH')
  if (thesis.state !== 'OPEN') return error(409, 'THESIS_NOT_OPEN')
  const text = typeof input.body === 'string' ? input.body.trim() : ''
  if (!text) return error(422, 'VALIDATION_ERROR')
  updates += 1
  const update: RawThesisUpdate = {
    id: mockId(42, updates),
    body: text,
    createdAt: new Date().toISOString(),
    author: { id: caller, username: thesis.creator!.username, avatarUrl: null },
  }
  ;(UPDATES[thesis.id] ??= []).push(update)
  return { status: 201, body: update }
}

/** PUT /api/v1/theses/{id}/cancel (E11): only its author, while it can (specs/thesis-detail § 9). */
export function cancelMockThesis({ params, body, accessToken }: MockContext): MockResponse {
  const index = THESES.findIndex((each) => each.id === params.id)
  const thesis = THESES[index]
  if (!thesis) return error(404, 'NOT_FOUND')
  const caller = mockCaller(accessToken)
  const input = (body ?? {}) as Record<string, unknown>
  if (typeof input.userId !== 'string') return error(400, 'BAD_REQUEST')
  if (input.userId !== caller || thesis.creator?.id !== caller) return error(403, 'USER_MISMATCH')
  if (!cancellable(thesis, caller)) return error(409, 'THESIS_NOT_CANCELLABLE')
  const cancelled: RawThesis = {
    ...thesis,
    state: 'CANCELLED',
    cancelledAt: new Date().toISOString(),
    cancellationReason: text(input.reason),
    canCancel: false,
  }
  THESES[index] = cancelled
  return { status: 200, body: cancelled }
}

/** PUT /api/v1/theses/{id}/vote (E05), as a post's. */
export function voteMockThesis({ params, body, accessToken }: MockContext): MockResponse {
  const thesis = THESES.find((each) => each.id === params.id)
  if (!thesis) return error(404, 'NOT_FOUND')
  const { userId, value } = (body ?? {}) as { userId?: unknown; value?: unknown }
  if (userId !== mockCaller(accessToken)) return error(403, 'USER_MISMATCH')
  if (value !== 1 && value !== -1) return error(422, 'INVALID')
  // The fixture score already includes the viewer's previous vote.
  return {
    status: 200,
    body: { score: thesis.score - (thesis.viewerVote ?? 0) + value, viewerVote: value },
  }
}

/** DELETE /api/v1/theses/{id}/vote (E05). */
export function removeMockThesisVote({ params, query, accessToken }: MockContext): MockResponse {
  if (!THESES.some((each) => each.id === params.id)) return error(404, 'NOT_FOUND')
  if (query.userId !== mockCaller(accessToken)) return error(403, 'USER_MISMATCH')
  return { status: 204 }
}

/**
 * GET /api/v1/theses/top-assets?days=&limit= (P-040, specs/thesis-form-steps): the asset communities
 * with the most theses published in the last `days` (30 by default), cancelled ones not counted.
 */
/**
 * The month's theses per asset the mocked ranking starts from (P-040). Only those with a community
 * show: the mock's (BTC, ETH, SOL, XRP, LINK, AVAX) or, with the backend, its own (BTC, ETH, SOL,
 * NVDA, AAPL in dev).
 */
const TOP_ASSETS_BASE: Record<string, number> = {
  BTC: 41,
  NVDA: 33,
  ETH: 27,
  SOL: 18,
  AAPL: 12,
  XRP: 11,
  LINK: 7,
  AVAX: 4,
}

/** An asset community's summary from the backend, or null when it has none. */
async function backendSummary(
  backend: NonNullable<MockContext['backend']>,
  slug: string,
): Promise<RawCommunitySummary | null> {
  const response = await backend(`/api/v1/communities/${encodeURIComponent(slug)}`).catch(
    () => null,
  )
  const community = response?.status === 200 ? (response.body as Partial<RawCommunity>) : null
  if (!community?.id || community.type !== 'SYSTEM_ASSET') return null
  return {
    id: community.id,
    slug,
    name: community.name ?? slug,
    type: community.type,
    avatarUrl: community.avatarUrl ?? null,
    viewerMembership: community.viewerMembership ?? null,
  }
}

export async function topThesisAssets({ query, backend }: MockContext): Promise<MockResponse> {
  const days = query.days === undefined ? 30 : Number(query.days)
  const limit = query.limit === undefined ? 10 : Number(query.limit)
  if (!Number.isInteger(days) || days < 1 || days > 365) return error(422, 'VALIDATION_ERROR')
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) return error(422, 'VALIDATION_ERROR')
  // From the mocks' clock (MOCK_NOW): the seeded theses are dated against it, not today.
  const since = Math.min(Date.now(), MOCK_NOW) - days * DAY_MS
  // A platform's month starts from a base (the few seeded theses would fit in one row, and the rail
  // would never move); what is published here adds to it.
  const counts = new Map<string, number>(Object.entries(TOP_ASSETS_BASE))
  for (const thesis of THESES) {
    if (thesis.state === 'CANCELLED' || thesis.community.type !== 'SYSTEM_ASSET') continue
    if (Date.parse(thesis.publishedAt) < since) continue
    counts.set(thesis.community.slug, (counts.get(thesis.community.slug) ?? 0) + 1)
  }
  const ranked = [...counts].sort(([a, x], [b, y]) => y - x || a.localeCompare(b))
  // With the backend, its communities: real ids to publish in, and their logos.
  const communities = await Promise.all(
    ranked.map(([slug]) =>
      backend
        ? backendSummary(backend, slug)
        : communityBySlug(slug)
          ? communitySummary(slug)
          : null,
    ),
  )
  const items = ranked
    .flatMap(([, thesisCount], index) => {
      const community = communities[index]
      return community ? [{ community, thesisCount }] : []
    })
    .slice(0, limit)
  return { status: 200, body: { items } }
}
