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

describe('a thesis’s arguments and updates in the mocks (specs/thesis-arguments § 8)', async () => {
  const { MOCK_ROUTES } = await import('./handlers')
  const route = (method: string, path: string) =>
    MOCK_ROUTES.find((each) => each.method === method && each.path === path)!
  const open = THESES[0]!
  const ctx = (
    params: Record<string, string>,
    query = {},
    body?: unknown,
    accessToken?: string,
  ) => ({
    params,
    query,
    body,
    accessToken,
  })

  it('reads one side, and counts each side from its arguments', async () => {
    const res = await route('GET', '/api/v1/theses/:id/comments').handler(
      ctx({ id: open.id }, { side: 'CONTRA' }),
    )
    const items = (res.body as { items: { side: string | null }[] }).items
    expect(items.length).toBe(1)
    expect(items.every((each) => each.side === 'CONTRA')).toBe(true)
    expect(asSeenBy(open, undefined).argumentCounts).toEqual({ pro: 3, contra: 1 })
  })

  it('needs a side to argue on a thesis', async () => {
    const post = route('POST', '/api/v1/theses/:id/comments')
    expect(
      (await post.handler(ctx({ id: open.id }, {}, { userId: DEMO_USER.id, body: 'Yes' }))).status,
    ).toBe(422)
    const res = await post.handler(
      ctx({ id: open.id }, {}, { userId: DEMO_USER.id, body: 'Yes', side: 'PRO' }),
    )
    expect(res).toMatchObject({ status: 201, body: { side: 'PRO' } })
  })

  it('lets only its author update an open thesis', async () => {
    const post = route('POST', '/api/v1/theses/:id/updates')
    const author = open.creator!.id
    const token = `mock-access.${author}.t`
    expect(
      (await post.handler(ctx({ id: open.id }, {}, { userId: DEMO_USER.id, body: 'Hi' }))).status,
    ).toBe(403)
    expect(
      await post.handler(ctx({ id: open.id }, {}, { userId: author, body: 'Still in.' }, token)),
    ).toMatchObject({ status: 201, body: { body: 'Still in.' } })
    const closed = THESES.find((each) => each.state === 'CORRECT')!
    const closedToken = `mock-access.${closed.creator!.id}.t`
    expect(
      await post.handler(
        ctx({ id: closed.id }, {}, { userId: closed.creator!.id, body: 'Late.' }, closedToken),
      ),
    ).toMatchObject({ status: 409, body: { error: { code: 'THESIS_NOT_OPEN' } } })
  })
})

describe('the mocked ranking of assets by theses (P-040, specs/thesis-form-steps)', async () => {
  const { topThesisAssets } = await import('./theses')
  const run = (query: Record<string, string>) =>
    topThesisAssets({ ...noRequest, query, body: undefined })

  it('counts the theses of each asset community, cancelled ones not, the most first', () => {
    const body = run({}).body as { items: { community: { type: string }; thesisCount: number }[] }
    expect(body.items.every((each) => each.community.type === 'SYSTEM_ASSET')).toBe(true)
    const counts = body.items.map((each) => each.thesisCount)
    expect(counts).toEqual([...counts].sort((a, b) => b - a))
  })

  it('refuses a period or a size out of range', () => {
    expect(run({ days: '0' }).status).toBe(422)
    expect(run({ limit: '21' }).status).toBe(422)
  })
})
