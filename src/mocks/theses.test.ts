// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { DEMO_USER } from './demo-user'
import { communityBySlug } from './fixtures/communities'
import { thesesBy } from './fixtures/theses'
import { createMockThesis } from './theses'

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
