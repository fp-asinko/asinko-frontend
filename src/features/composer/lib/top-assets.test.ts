import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MOCK_ROUTES } from '@/mocks/handlers'
import type { MockRoute } from '@/mocks/types'
import { getTopThesisAssets } from './top-assets'

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

describe('getTopThesisAssets (P-040, specs/thesis-form-steps FS-04)', () => {
  beforeEach(() => {
    state.routes = MOCK_ROUTES
  })

  it('lists asset communities as options, the most theses first', async () => {
    const result = await getTopThesisAssets()
    if (!result.ok) throw new Error('expected ok')
    expect(result.data.length).toBeGreaterThan(0)
    expect(result.data[0]).toMatchObject({
      option: { handle: expect.stringMatching(/^\$/), own: false },
      thesisCount: expect.any(Number),
    })
    const counts = result.data.map((each) => each.thesisCount)
    expect(counts).toEqual([...counts].sort((a, b) => b - a))
  })

  it('passes a failure through, for the page to show no rail (FS-07)', async () => {
    state.routes = []
    expect(await getTopThesisAssets()).toMatchObject({ ok: false })
  })
})
