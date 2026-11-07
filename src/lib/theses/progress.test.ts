// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { thesisProgress } from './progress'
import type { ThesisTicketData } from './ticket.types'

const ticket = (overrides: Partial<ThesisTicketData> = {}): ThesisTicketData => ({
  id: 't1',
  asset: { symbol: 'NVDA', name: 'NVIDIA', path: '/asset/NVDA', logoUrl: null },
  target: { direction: 'above', price: 200 },
  current: { price: 150, at: '2026-11-05T12:00:00.000Z', stale: false },
  reference: { price: 100, at: '2026-11-01T12:00:00.000Z' },
  deadline: '2027-11-04T12:00:00.000Z',
  number: null,
  conviction: 3,
  state: 'open',
  resolution: null,
  cancellation: null,
  ...overrides,
})

describe('thesisProgress (specs/thesis-identity)', () => {
  it('is on its way: the share done and what is left from today’s price (TI-01, TI-02)', () => {
    const progress = thesisProgress(ticket())
    expect(progress).toMatchObject({
      kind: 'toward',
      share: 0.5,
      entry: 100,
      target: 200,
      price: 150,
    })
    expect(progress?.kind === 'toward' && progress.remaining).toBeCloseTo(50 / 150)
  })

  it('reads a bearish bet the same way, the target under the entry', () => {
    const progress = thesisProgress(
      ticket({
        target: { direction: 'below', price: 80 },
        current: { price: 95, at: null, stale: false },
      }),
    )
    expect(progress).toMatchObject({ kind: 'toward', share: 0.25 })
  })

  it('says the target is reached, past it before its deadline (TI-03)', () => {
    expect(
      thesisProgress(ticket({ current: { price: 210, at: null, stale: false } })),
    ).toMatchObject({
      kind: 'reached',
    })
  })

  it('says how far against it went, crossing the entry the other way (TI-04)', () => {
    const progress = thesisProgress(ticket({ current: { price: 96, at: null, stale: false } }))
    expect(progress).toMatchObject({ kind: 'against' })
    expect(progress?.kind === 'against' && progress.change).toBeCloseTo(-0.04)
  })

  it('measures a closed one at its resolution’s price, not today’s (TI-05)', () => {
    const progress = thesisProgress(
      ticket({
        state: 'correct',
        resolution: { price: 205, at: '2027-11-04T12:00:00.000Z', source: 'automatic' },
      }),
    )
    expect(progress).toMatchObject({ kind: 'reached', closed: true, price: 205 })
  })

  it.each([
    ['cancelled', { state: 'cancelled' as const }],
    [
      'a resolution without a price',
      { state: 'incorrect' as const, resolution: { price: null, at: 'x', source: null } },
    ],
    ['no price today', { current: null }],
    ['a target at a price', { target: { direction: 'equals' as const, price: 200 } }],
    ['no target', { target: null }],
    ['no entry', { reference: null }],
    ['the target at the entry', { target: { direction: 'above' as const, price: 100 } }],
  ])('has nothing to measure with %s (TI-05 to TI-07)', (_, overrides) => {
    expect(thesisProgress(ticket(overrides))).toBeNull()
  })

  it('says when an old price is from, only while open (TI-06)', () => {
    const stale = ticket({ current: { price: 150, at: '2026-11-03T12:00:00.000Z', stale: true } })
    expect(thesisProgress(stale)?.staleAt).toBe('2026-11-03T12:00:00.000Z')
    expect(thesisProgress(ticket())?.staleAt).toBeNull()
  })
})
