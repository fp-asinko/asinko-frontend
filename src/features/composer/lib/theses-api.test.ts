import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEMO_USER } from '@/mocks/demo-user'
import { communityBySlug } from '@/mocks/fixtures/communities'
import { assetBySymbol } from '@/mocks/fixtures/assets'
import { MOCK_ROUTES } from '@/mocks/handlers'
import type { MockRoute } from '@/mocks/types'
import { thesesBy } from '@/mocks/fixtures/theses'
import { assetQuote, createThesisAs } from './theses-api'

// The real client against the mock routes; a route left out reaches a fetch that always fails.
const state = vi.hoisted(() => ({ routes: [] as readonly MockRoute[] }))
vi.mock('@/lib/api', async () => {
  const { createApiClient } = await import('@/lib/api/create-client')
  return {
    apiRequest: (request: Parameters<ReturnType<typeof createApiClient>>[0]) =>
      createApiClient({
        baseUrl: 'http://mock',
        fetch: () => Promise.reject(new Error('offline')),
        mocks: state.routes,
      })(request),
  }
})

const input = () => ({
  communityId: communityBySlug('BTC')!.id,
  assetSymbol: 'BTC',
  claim: 'BTC above 150K by the deadline',
  direction: 'ABOVE' as const,
  targetPrice: 150000,
  deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  conviction: 'HIGH' as const,
  reasoning: 'ETF flows.',
  disclaimerAccepted: true as const,
})

describe('createThesisAs (specs/thesis-create TC-13)', () => {
  beforeEach(() => {
    state.routes = MOCK_ROUTES
  })

  it('publishes with the direction as targetDirection, and answers the new id', async () => {
    const result = await createThesisAs(DEMO_USER.id, input())
    if (!result.ok) throw new Error('expected ok')
    expect(thesesBy(DEMO_USER.id)[0]).toMatchObject({
      id: result.data.id,
      targetDirection: 'ABOVE',
      targetPrice: 150000,
    })
  })

  it('answers the backend code of a failure', async () => {
    const result = await createThesisAs(DEMO_USER.id, { ...input(), assetSymbol: 'NOPE' })
    expect(result).toMatchObject({ ok: false, code: 'ASSET_NOT_FOUND' })
  })

  it('answers unavailable without the backend', async () => {
    state.routes = []
    expect(await createThesisAs(DEMO_USER.id, input())).toMatchObject({
      ok: false,
      kind: 'unexpected',
    })
  })
})

describe('assetQuote (TC-05)', () => {
  beforeEach(() => {
    state.routes = MOCK_ROUTES
  })

  it('reads the name, the price, the day and whether it is stale (TC-22)', async () => {
    const btc = assetBySymbol('BTC')!
    expect(await assetQuote('BTC')).toEqual({
      name: btc.name,
      price: btc.price,
      changePct: btc.priceChangePct,
      stale: btc.priceStale,
    })
  })

  it('is null for an unknown asset, a bad symbol or without the backend', async () => {
    expect(await assetQuote('NOPE')).toBeNull()
    expect(await assetQuote('../x')).toBeNull()
    state.routes = []
    expect(await assetQuote('BTC')).toBeNull()
  })
})
