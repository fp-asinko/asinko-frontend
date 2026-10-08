import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MOCK_ROUTES } from '@/mocks/handlers'
import type { MockRoute } from '@/mocks/types'
import { searchMentionOptions, SUGGESTIONS } from './mentions-api'

// The real client against the mock routes; a route left out reaches a fetch that always fails.
const state = vi.hoisted(() => ({ routes: [] as readonly MockRoute[] }))
vi.mock('@/lib/api', async () => {
  const { createApiClient } = await import('@/lib/api/create-client')
  const { paginatedSchema } = await import('@/lib/api/schemas')
  return {
    paginatedSchema,
    apiRequest: (request: Parameters<ReturnType<typeof createApiClient>>[0]) =>
      createApiClient({
        baseUrl: 'http://mock',
        fetch: () => Promise.reject(new Error('offline')),
        mocks: state.routes,
      })(request),
  }
})

describe('searchMentionOptions (specs/mention-autocomplete MA-02, MA-03)', () => {
  beforeEach(() => {
    state.routes = MOCK_ROUTES
  })

  it('suggests assets for $, written in upper case, with their name', async () => {
    const result = await searchMentionOptions('asset', 'bitc')
    expect(result).toMatchObject({
      ok: true,
      data: [{ kind: 'asset', handle: '$BTC', label: 'Bitcoin', colorKey: 'BTC' }],
    })
  })

  it('suggests only groups for #, with a name only when it says more', async () => {
    const result = await searchMentionOptions('community', 'de')
    if (!result.ok) throw new Error('expected ok')
    expect(result.data.map((each) => each.handle)).toContain('#defi')
    expect(result.data.every((each) => each.handle.startsWith('#'))).toBe(true)
    expect(result.data.find((each) => each.handle === '#defi')?.label).toBeNull()
  })

  it('suggests people for @', async () => {
    const result = await searchMentionOptions('user', 'mar')
    expect(result).toMatchObject({
      ok: true,
      data: expect.arrayContaining([expect.objectContaining({ kind: 'user', handle: '@maria' })]),
    })
  })

  it(`shows at most ${SUGGESTIONS}`, async () => {
    const result = await searchMentionOptions('asset', 'a')
    expect(result.ok && result.data.length).toBeLessThanOrEqual(SUGGESTIONS)
  })

  it('passes a failure through', async () => {
    state.routes = []
    expect(await searchMentionOptions('user', 'mar')).toMatchObject({ ok: false })
  })
})
