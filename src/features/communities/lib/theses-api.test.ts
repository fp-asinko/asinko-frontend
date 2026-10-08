import { describe, expect, it, vi } from 'vitest'
import { MOCK_ROUTES } from '@/mocks/handlers'
import { THESES } from '@/mocks/fixtures/theses'
import { PROFILES } from '@/mocks/fixtures/users'
import { getUserTheses, toThesisItem } from './theses-api'

const network = vi.hoisted(() => ({ calls: 0 }))
vi.mock('@/lib/api', async () => {
  const { createApiClient } = await import('@/lib/api/create-client')
  const { invalidInput } = await import('@/lib/api/errors')
  const { keepValidItems: keepValid } = await import('@/lib/api/helpers')
  return {
    invalidInput,
    keepValidItems: (items: unknown[], schema: never) => keepValid(items, schema, () => {}),
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

const id = (username: string) => PROFILES.find((each) => each.username === username)!.id

describe('getUserTheses (specs/profile-track-record PT-05)', () => {
  it('pages a person’s theses, the newest first, 20 at a time', async () => {
    const first = await getUserTheses(id('maria'))
    if (!first.ok) throw new Error('expected a page')
    expect(first.data.items).toHaveLength(20)
    expect(first.data.items[0]!.claim).toBe('BTC will close above $150K before December 2026')
    expect(first.data.nextCursor).not.toBeNull()

    const second = await getUserTheses(id('maria'), first.data.nextCursor!)
    if (!second.ok) throw new Error('expected a page')
    expect(second.data.items.length).toBeGreaterThan(0)
    expect(second.data.nextCursor).toBeNull()
  })

  it('answers an empty list for someone without theses', async () => {
    const result = await getUserTheses(id('jeppe'))
    expect(result).toEqual({ ok: true, data: { items: [], nextCursor: null } })
  })

  it('checks the id and the cursor before the network', async () => {
    network.calls = 0
    expect((await getUserTheses('not-a-uuid')).ok).toBe(false)
    expect((await getUserTheses(id('maria'), 'bad cursor!')).ok).toBe(false)
    expect(network.calls).toBe(0)
  })
})

describe('toThesisItem (PT-07)', () => {
  const by = (claim: string) => THESES.find((each) => each.claim === claim)!

  it('maps an open thesis on an asset, with its target and conviction', () => {
    expect(toThesisItem(by('BTC will close above $150K before December 2026'))).toMatchObject({
      asset: { symbol: 'BTC', path: '/asset/BTC' },
      state: 'open',
      target: { direction: 'above', price: 150000 },
      conviction: 3,
      resolutionPrice: null,
    })
  })

  it('keeps a qualitative thesis without asset nor target, and the reason it was cancelled', () => {
    expect(toThesisItem(by('The Fed cuts twice more before the year ends'))).toMatchObject({
      asset: null,
      target: null,
      state: 'cancelled',
      cancellationReason: 'Posted twice by mistake.',
    })
  })

  it('keeps the price it resolved at', () => {
    expect(toThesisItem(by('XRP drops below $2 after the ETF delay'))).toMatchObject({
      state: 'incorrect',
      target: { direction: 'below' },
      resolutionPrice: 2.41,
    })
  })
})
