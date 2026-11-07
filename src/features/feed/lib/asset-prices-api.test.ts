import { describe, expect, it, vi } from 'vitest'
import { MOCK_ROUTES } from '@/mocks/handlers'
import { getAssetPrices } from './asset-prices-api'

// The real client against the mock routes (P-046); a route left out reaches a fetch that fails.
const state = vi.hoisted(() => ({ offline: false, reported: vi.fn(), fetch: vi.fn() }))

vi.mock('@/lib/api', async () => {
  const { createApiClient } = await import('@/lib/api/create-client')
  const { keepValidItems: keepValid } = await import('@/lib/api/helpers')
  return {
    keepValidItems: (items: unknown[], schema: never) => keepValid(items, schema, state.reported),
    apiRequest: (request: Parameters<ReturnType<typeof createApiClient>>[0]) =>
      createApiClient({
        baseUrl: 'http://mock',
        fetch: (...args: unknown[]) => {
          state.fetch(...args)
          return Promise.reject(new Error('offline'))
        },
        mocks: state.offline ? [] : MOCK_ROUTES,
      })(request),
  }
})

const FROM = '2026-10-01T00:00:00.000Z'
const TO = '2026-10-31T00:00:00.000Z'

describe('getAssetPrices (P-046, specs/thesis-chart CH-06)', () => {
  it('gives the history oldest first', async () => {
    const points = (await getAssetPrices('BTC', FROM, TO))!
    expect(points.length).toBeGreaterThan(2)
    expect(points[0]).toEqual({ at: FROM, price: expect.any(Number) })
    expect(points.map((each) => each.at)).toEqual(points.map((each) => each.at).toSorted())
  })

  it('checks the symbol and the dates before asking', async () => {
    state.fetch.mockClear()
    expect(await getAssetPrices('../users', FROM, TO)).toBeNull()
    expect(await getAssetPrices('BTC', 'yesterday', TO)).toBeNull()
    expect(await getAssetPrices('BTC', TO, FROM)).toBeNull()
    expect(state.fetch).not.toHaveBeenCalled()
  })

  it('gives null when it cannot be asked: the page shows the thesis without it', async () => {
    state.offline = true
    expect(await getAssetPrices('ETH', FROM, TO)).toBeNull()
    state.offline = false
  })
})
