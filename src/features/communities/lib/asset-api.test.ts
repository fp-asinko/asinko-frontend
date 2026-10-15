import { describe, expect, it, vi } from 'vitest'
import { MOCK_ROUTES } from '@/mocks/handlers'
import { getAssetSummary } from './asset-api'

const network = vi.hoisted(() => ({ calls: 0 }))
vi.mock('@/lib/api', async () => {
  const { createApiClient } = await import('@/lib/api/create-client')
  const { invalidInput } = await import('@/lib/api/errors')
  return {
    invalidInput,
    apiRequest: (request: Parameters<ReturnType<typeof createApiClient>>[0]) => {
      network.calls += 1
      return createApiClient({
        baseUrl: 'http://mock',
        fetch: () => Promise.reject(new Error('offline')),
        mocks: MOCK_ROUTES,
      })(request)
    },
  }
})

describe('getAssetSummary (specs/backend-answer-1013 BA-09)', () => {
  it('reads an asset without a community, its symbol with "/" encoded in the path', async () => {
    expect(await getAssetSummary('XAU/USD')).toEqual({
      ok: true,
      data: {
        symbol: 'XAU/USD',
        handle: '$XAU/USD',
        name: 'Gold Spot / US Dollar',
        logoUrl: null,
        communitySlug: null,
      },
    })
  })

  it('says which community an asset has, when it has one', async () => {
    const result = await getAssetSummary('BTC')
    expect(result).toMatchObject({ ok: true, data: { handle: '$BTC', communitySlug: 'BTC' } })
  })

  it('is not found outside the catalog, and checks the symbol before the network', async () => {
    expect(await getAssetSummary('NOPE')).toMatchObject({ ok: false, code: 'NOT_FOUND' })
    network.calls = 0
    expect((await getAssetSummary('../x')).ok).toBe(false)
    expect(network.calls).toBe(0)
  })
})
