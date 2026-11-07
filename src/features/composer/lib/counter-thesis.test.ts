import { beforeEach, describe, expect, it, vi } from 'vitest'
import { THESES } from '@/mocks/fixtures/theses'
import { MOCK_ROUTES } from '@/mocks/handlers'
import type { MockRoute } from '@/mocks/types'
import { getCounterThesis } from './counter-thesis'

// The real client against the mock routes; a route left out fails.
const state = vi.hoisted(() => ({ routes: [] as readonly MockRoute[], fetch: vi.fn() }))
vi.mock('@/lib/api', async () => {
  const { createApiClient } = await import('@/lib/api/create-client')
  return {
    apiRequest: (request: Parameters<ReturnType<typeof createApiClient>>[0]) =>
      createApiClient({ baseUrl: 'http://mock', fetch: state.fetch, mocks: state.routes })(request),
  }
})

const open = THESES.find((each) => each.state === 'OPEN' && each.asset && each.targetPrice)!

describe('getCounterThesis (specs/thesis-agree AG-11)', () => {
  beforeEach(() => {
    state.routes = MOCK_ROUTES
    state.fetch.mockReset().mockRejectedValue(new Error('offline'))
  })

  it('takes an open thesis with its asset, target and deadline', async () => {
    expect(await getCounterThesis(open.id)).toEqual({
      id: open.id,
      author: open.creator!.username,
      symbol: open.asset!.symbol,
      direction: open.targetDirection!.toLowerCase(),
      targetPrice: open.targetPrice,
      deadline: open.deadline,
    })
  })

  it('checks the id before the request: anything else is null, without asking', async () => {
    state.routes = []
    expect(await getCounterThesis('../posts')).toBeNull()
    expect(await getCounterThesis(undefined)).toBeNull()
    expect(state.fetch).not.toHaveBeenCalled()
  })

  it('is null for a closed thesis or one that does not exist', async () => {
    const closed = THESES.find((each) => each.state === 'CORRECT')!
    expect(await getCounterThesis(closed.id)).toBeNull()
    expect(await getCounterThesis('00000000-0000-4000-8000-0000000000ff')).toBeNull()
  })
})
