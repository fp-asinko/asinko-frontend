// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { thesisSchema } from '@/lib/api/contract'
import { THESES } from './fixtures/theses'
import {
  extendWithIdentity,
  resolvedCountOf,
  sequenceOf,
  todayPriceOf,
  withIdentity,
} from './thesis-identity'

const OPEN = THESES.find((each) => each.state === 'OPEN' && each.targetPrice !== null)!

describe('thesis identity mock (specs/thesis-identity, P-044, P-045)', () => {
  it('adds today’s price and the author’s count, in the contract’s shape', () => {
    const thesis = withIdentity(OPEN)
    expect(thesisSchema.parse(thesis)).toBeTruthy()
    expect(thesis.creator?.resolvedCount).toBeTypeOf('number')
    expect(thesis.asset).toHaveProperty('price')
  })

  it('shows each case across the fixtures: toward, past, against and none', () => {
    const shares = THESES.filter((each) => each.referencePrice && each.targetPrice).map((each) => {
      const price = todayPriceOf(each)
      return price === null
        ? null
        : (price - each.referencePrice!) / (each.targetPrice! - each.referencePrice!)
    })
    expect(shares.some((each) => each !== null && each > 0 && each < 1)).toBe(true)
    expect(shares.some((each) => each !== null && each >= 1)).toBe(true)
    expect(shares.some((each) => each !== null && each < 0)).toBe(true)
    expect(shares).toContain(null)
  })

  it('numbers a fixture’s theses by publication among its author’s, from 1 (P-047)', () => {
    const marias = THESES.filter((each) => each.creator?.username === 'maria').toSorted((a, b) =>
      a.publishedAt.localeCompare(b.publishedAt),
    )
    expect(marias.map(sequenceOf)).toEqual(marias.map((_, index) => index + 1))
    expect(withIdentity(marias[0]!).authorSequence).toBe(1)
    // One the fixtures do not have: 1 to 40.
    expect(sequenceOf({ ...OPEN, id: 'real-thesis' })).toBeGreaterThanOrEqual(1)
  })

  it('has no price without an entry or a target', () => {
    expect(todayPriceOf({ ...OPEN, targetPrice: null })).toBeNull()
    expect(todayPriceOf({ ...OPEN, referencePrice: null })).toBeNull()
  })

  it('counts a fixture’s resolved theses, and some unknown authors under three', () => {
    expect(resolvedCountOf(OPEN.creator!)).toBeGreaterThanOrEqual(0)
    const counts = Array.from({ length: 12 }, (_, n) =>
      resolvedCountOf({ ...OPEN.creator!, username: `nobody${n}`, id: `id-${n}` }),
    )
    expect(counts.some((each) => each < 3)).toBe(true)
    expect(counts.some((each) => each >= 3)).toBe(true)
  })

  it('extends a feed’s, a list’s and a page’s theses, and leaves the rest', () => {
    const feed = extendWithIdentity({
      status: 200,
      body: {
        items: [
          { kind: 'THESIS', content: OPEN },
          { kind: 'POST', content: { id: 'x' } },
        ],
      },
    })
    const [thesis, post] = (feed.body as { items: { content: unknown }[] }).items
    expect(thesis!.content).toHaveProperty('creator.resolvedCount')
    expect(post!.content).toEqual({ id: 'x' })

    const list = extendWithIdentity({ status: 200, body: { items: [OPEN], nextCursor: null } })
    expect((list.body as { items: unknown[] }).items[0]).toHaveProperty('creator.resolvedCount')

    expect(extendWithIdentity({ status: 200, body: OPEN }).body).toHaveProperty(
      'creator.resolvedCount',
    )
    const missing = { status: 404, body: { error: { code: 'NOT_FOUND' } } }
    expect(extendWithIdentity(missing)).toBe(missing)
  })
})
