// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { RawThesis } from '@/lib/api/contract'
import { DEMO_USER } from './demo-user'
import { communityBySlug } from './fixtures/communities'
import { THESES, thesesBy } from './fixtures/theses'
import { asSeenBy, cancelMockThesis, createMockThesis, voteMockThesis } from './theses'

const DAY_MS = 24 * 60 * 60 * 1000
const noRequest = { params: {}, query: {} }
const valid = () => ({
  userId: DEMO_USER.id,
  communityId: communityBySlug('BTC')!.id,
  assetSymbol: 'BTC',
  claim: 'BTC closes the year above 150K',
  reasoning: 'ETF flows.',
  conviction: 'HIGH',
  deadline: new Date(Date.now() + 30 * DAY_MS).toISOString(),
  targetPrice: 150000,
  targetDirection: 'ABOVE',
  disclaimerAccepted: true,
})
const send = (changes: Record<string, unknown> = {}) =>
  createMockThesis({ ...noRequest, body: { ...valid(), ...changes } })
const code = (changes: Record<string, unknown>) => {
  const response = send(changes)
  return [response.status, (response.body as { error: { code: string } }).error.code]
}

describe('the mocked POST /theses (specs/thesis-create § 9)', () => {
  it('creates an open thesis with the reference price, first in its author’s', () => {
    const response = send({ claim: 'First of all' })
    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({
      state: 'OPEN',
      claim: 'First of all',
      asset: { symbol: 'BTC' },
      targetDirection: 'ABOVE',
      canCancel: true,
    })
    expect((response.body as { referencePrice: number | null }).referencePrice).not.toBeNull()
    expect(thesesBy(DEMO_USER.id)[0]?.claim).toBe('First of all')
  })

  it('answers each error as the backend', () => {
    expect(code({ userId: '00000000-0000-4000-8000-000000000999' })).toEqual([403, 'USER_MISMATCH'])
    expect(code({ communityId: 'nope' })).toEqual([422, 'INVALID_COMMUNITY'])
    expect(code({ assetSymbol: 'NOPE' })).toEqual([404, 'ASSET_NOT_FOUND'])
    expect(code({ claim: 'a'.repeat(281) })).toEqual([422, 'CLAIM_TOO_LONG'])
    expect(code({ reasoning: ' ' })).toEqual([422, 'VALIDATION_ERROR'])
    expect(code({ targetPrice: '200' })).toEqual([422, 'VALIDATION_ERROR'])
    expect(code({ disclaimerAccepted: false })).toEqual([422, 'DISCLAIMER_NOT_ACCEPTED'])
    expect(code({ deadline: new Date(Date.now() + DAY_MS / 2).toISOString() })).toEqual([
      422,
      'DEADLINE_OUT_OF_RANGE',
    ])
    expect(code({ deadline: new Date(Date.now() + 6 * 365 * DAY_MS).toISOString() })).toEqual([
      422,
      'DEADLINE_OUT_OF_RANGE',
    ])
  })

  it("refuses someone else's personal channel", () => {
    const other = communityBySlug('maria')!
    expect(code({ communityId: other.id })).toEqual([403, 'PERSONAL_CHANNEL_OWNER_ONLY'])
  })
})

describe('cancelling and voting a mocked thesis (specs/thesis-detail § 9)', () => {
  // A fresh one of the demo user each time: the fixtures keep none of @demo's.
  const demo = () => send({ claim: `To cancel ${Math.random()}` }).body as RawThesis
  const maria = () =>
    THESES.find((each) => each.creator?.id !== DEMO_USER.id && each.state === 'OPEN')!
  const cancel = (id: string, userId = DEMO_USER.id) =>
    cancelMockThesis({ ...noRequest, params: { id }, body: { userId, reason: 'Wrong asset.' } })

  it('lets only its author cancel it: canCancel is the caller’s', () => {
    expect(asSeenBy(demo(), undefined).canCancel).toBe(true)
    expect(asSeenBy(maria(), undefined).canCancel).toBe(false)
    expect(cancel(maria().id).status).toBe(403)
  })

  it('cancels it once, with its reason, and then answers 409', () => {
    const thesis = demo()
    const response = cancel(thesis.id)
    expect(response).toMatchObject({
      status: 200,
      body: { state: 'CANCELLED', cancellationReason: 'Wrong asset.', canCancel: false },
    })
    expect(cancel(thesis.id)).toMatchObject({
      status: 409,
      body: { error: { code: 'THESIS_NOT_CANCELLABLE' } },
    })
  })

  it('refuses the last 10 % of its window', () => {
    const now = Date.now()
    const late = {
      ...maria(),
      creator: { ...maria().creator!, id: DEMO_USER.id },
      publishedAt: new Date(now - 95 * DAY_MS).toISOString(),
      deadline: new Date(now + 5 * DAY_MS).toISOString(),
    }
    expect(asSeenBy(late, undefined).canCancel).toBe(false)
  })

  it('votes as a post', () => {
    const thesis = maria()
    expect(
      voteMockThesis({
        ...noRequest,
        params: { id: thesis.id },
        body: { userId: DEMO_USER.id, value: 1 },
      }),
    ).toMatchObject({ status: 200, body: { score: thesis.score + 1, viewerVote: 1 } })
  })
})
