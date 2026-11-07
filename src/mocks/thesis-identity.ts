import type { RawThesis } from '@/lib/api/contract'
import { THESES } from './fixtures/theses'
import { userByUsername } from './fixtures/users'
import type { MockContext, MockResponse } from './types'

// P-044 and P-045 (proposals, specs/thesis-identity): today's price of a thesis's asset and how many
// theses its author has resolved. Stable per thesis, so a page always looks the same.

function hashOf(value: string): number {
  let hash = 0
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return hash
}

/**
 * Where today's price stands between the entry (0) and the target (1): toward it, past it, against
 * it, or none (no market data). From the id, so each case shows in the feed.
 */
const PROGRESS = [0.35, 0.62, 1.08, -0.06, null] as const

/** Today's price, from the thesis's own entry and target; null without them or for one of five. */
export function todayPriceOf(thesis: RawThesis): number | null {
  const { referencePrice: entry, targetPrice: target } = thesis
  if (entry === null || target === null) return null
  const share = PROGRESS[hashOf(thesis.id) % PROGRESS.length] ?? null
  if (share === null) return null
  return Math.round((entry + (target - entry) * share) * 100) / 100
}

/** The author's resolved theses: the fixture's profile, else one under or over the 3 (TI-09). */
export function resolvedCountOf(creator: NonNullable<RawThesis['creator']>): number {
  const profile = userByUsername(creator.username)
  if (profile) return profile.correctCount + profile.incorrectCount
  const hash = hashOf(creator.id)
  return hash % 4 === 0 ? 1 : 3 + (hash % 30)
}

/**
 * The theses seen, by asset and the date their history starts: where each began and where it is
 * today, so the price history (P-046, asset-prices.ts) ends where the ticket says. In memory; a few
 * hundred at most.
 */
const ANCHORS = new Map<string, { start: number; end: number }>()

const anchorKey = (symbol: string, from: string) => `${symbol.toUpperCase()}|${from}`

/** Where a price history from `from` should start and end, if a thesis was seen there. */
export function anchorOf(symbol: string, from: string) {
  return ANCHORS.get(anchorKey(symbol, from))
}

function remember(thesis: RawThesis, price: number | null) {
  if (!thesis.asset || thesis.referencePrice === null) return
  if (ANCHORS.size > 500) ANCHORS.clear()
  const from = thesis.referencePriceAt ?? thesis.publishedAt
  const end = price ?? thesis.resolutionPrice ?? thesis.referencePrice
  ANCHORS.set(anchorKey(thesis.asset.symbol, from), { start: thesis.referencePrice, end })
}

/**
 * Its order among its author's theses (P-047, specs/thesis-number): the fixtures' by publication;
 * one the fixtures do not have (the backend's, with API_MOCKS=missing), from its id, 1 to 40.
 */
export function sequenceOf(thesis: RawThesis): number {
  const mine = THESES.filter(
    (each) => each.creator?.id && each.creator.id === thesis.creator?.id,
  ).toSorted((a, b) => a.publishedAt.localeCompare(b.publishedAt))
  const index = mine.findIndex((each) => each.id === thesis.id)
  return index >= 0 ? index + 1 : 1 + (hashOf(thesis.id) % 40)
}

/** A thesis with today's price and its author's count, as the backend would send them. */
export function withIdentity(thesis: RawThesis): RawThesis {
  const price = todayPriceOf(thesis)
  remember(thesis, price)
  return {
    ...thesis,
    asset: thesis.asset && {
      ...thesis.asset,
      price,
      priceUpdatedAt: price === null ? null : new Date(Date.now() - 60_000).toISOString(),
      // One in seven a stale price, to show its date (TI-06).
      priceStale: hashOf(thesis.id) % 7 === 0,
    },
    creator: thesis.creator && {
      ...thesis.creator,
      resolvedCount: resolvedCountOf(thesis.creator),
    },
    authorSequence: sequenceOf(thesis),
  }
}

/**
 * With API_MOCKS=missing: the backend's theses with what P-044 and P-045 add (MOCK_EXTENSIONS),
 * in a list's items, a feed's (`{ kind: 'THESIS', content }`) or a thesis's page.
 */
export function extendWithIdentity(response: MockResponse, _context?: MockContext): MockResponse {
  const body = response.body
  if (response.status !== 200 || typeof body !== 'object' || body === null) return response
  if ('items' in body && Array.isArray(body.items)) {
    const items = body.items.map((item: unknown) => {
      if (isThesis(item)) return withIdentity(item)
      const each = item as { kind?: unknown; content?: unknown }
      return each.kind === 'THESIS' && isThesis(each.content)
        ? { ...each, content: withIdentity(each.content) }
        : item
    })
    return { ...response, body: { ...body, items } }
  }
  return isThesis(body) ? { ...response, body: withIdentity(body) } : response
}

function isThesis(value: unknown): value is RawThesis {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'deadline' in value &&
    'referencePrice' in value
  )
}
