import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MOCK_ROUTES } from '@/mocks/handlers'
import type { MockRoute } from '@/mocks/types'
import { groupSlugAvailability } from './group-slug'

// The real client against the mock routes; without them, a fetch that always fails.
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

describe('groupSlugAvailability (specs/community-create CG-06)', () => {
  beforeEach(() => {
    state.routes = MOCK_ROUTES
  })

  it('is taken for an existing group and free for a 404', async () => {
    expect(await groupSlugAvailability('defi')).toBe('taken')
    expect(await groupSlugAvailability('nobody-has-this')).toBe('free')
  })

  it('is not known when the backend fails', async () => {
    state.routes = []
    expect(await groupSlugAvailability('defi')).toBe('unknown')
  })
})
