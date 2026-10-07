import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MOCK_ROUTES } from '@/mocks/handlers'
import type { MockRoute } from '@/mocks/types'
import { getCommunityPage } from './community-api'

// The real client against the mock routes; a route left out reaches a fetch that always fails.
const state = vi.hoisted(() => ({ routes: [] as readonly MockRoute[], calls: 0 }))
vi.mock('@/lib/api', async () => {
  const { createApiClient } = await import('@/lib/api/create-client')
  const { invalidInput } = await import('@/lib/api/errors')
  return {
    invalidInput,
    apiRequest: (request: Parameters<ReturnType<typeof createApiClient>>[0]) => {
      state.calls++
      return createApiClient({
        baseUrl: 'http://mock',
        fetch: () => Promise.reject(new Error('offline')),
        mocks: state.routes,
      })(request)
    },
  }
})

describe('getCommunityPage (specs/community-pages)', () => {
  beforeEach(() => {
    state.routes = MOCK_ROUTES
    state.calls = 0
  })

  it('maps a group and an asset community', async () => {
    expect(await getCommunityPage('defi')).toMatchObject({
      ok: true,
      data: { handle: '#defi', kind: 'group' },
    })
    expect(await getCommunityPage('BTC')).toMatchObject({
      ok: true,
      data: { handle: '$BTC', kind: 'asset' },
    })
  })

  it('passes NOT_FOUND through, for the not-found page (CP-02)', async () => {
    expect(await getCommunityPage('nope')).toMatchObject({ ok: false, code: 'NOT_FOUND' })
  })

  it('rejects an invalid slug before any request', async () => {
    expect(await getCommunityPage('../admin')).toMatchObject({ ok: false, code: 'INVALID' })
    expect(state.calls).toBe(0)
  })
})
