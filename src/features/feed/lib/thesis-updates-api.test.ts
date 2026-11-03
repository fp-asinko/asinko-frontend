import { beforeEach, describe, expect, it, vi } from 'vitest'
import { THESES } from '@/mocks/fixtures/theses'
import { MOCK_ROUTES } from '@/mocks/handlers'
import type { MockRoute } from '@/mocks/types'
import { createThesisUpdateAs, getThesisUpdates } from './thesis-updates-api'

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

describe('a thesis’s updates (specs/thesis-arguments TA-09, TA-10)', () => {
  beforeEach(() => {
    state.routes = MOCK_ROUTES
  })
  const open = THESES[0]!

  it('lists them the newest first, from { items } (Q6)', async () => {
    const result = await getThesisUpdates(open.id)
    expect(result).toMatchObject({ ok: true, data: [{ body: expect.stringContaining('ETF') }] })
  })

  it('takes a bare list too, as E11 says it', async () => {
    state.routes = MOCK_ROUTES.map((route) =>
      route.method === 'GET' && route.path === '/api/v1/theses/:id/updates'
        ? {
            ...route,
            handler: () => ({
              status: 200,
              body: [
                {
                  id: '00000000-0000-4000-8000-000000042001',
                  body: 'Older',
                  createdAt: '2026-11-01T10:00:00.000Z',
                  author: { id: open.creator!.id, username: 'maria', avatarUrl: null },
                },
                {
                  id: '00000000-0000-4000-8000-000000042002',
                  body: 'Newer',
                  createdAt: '2026-11-02T10:00:00.000Z',
                  author: { id: open.creator!.id, username: 'maria', avatarUrl: null },
                },
              ],
            }),
          }
        : route,
    )
    const result = await getThesisUpdates(open.id)
    expect(result.ok && result.data.map((each) => each.body)).toEqual(['Newer', 'Older'])
  })

  it('passes a refusal through: only its author posts one', async () => {
    expect(
      await createThesisUpdateAs('00000000-0000-4000-8000-0000000000ff', {
        thesisId: open.id,
        body: 'Not mine.',
      }),
    ).toMatchObject({ ok: false, code: 'USER_MISMATCH' })
  })
})
