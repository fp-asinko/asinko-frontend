import { describe, expect, it, vi } from 'vitest'
import { MOCK_ROUTES } from '@/mocks/handlers'
import { getSubmitCommunity } from './submit-community'

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

describe('getSubmitCommunity (specs/submit-page SU-03, SU-07)', () => {
  it("a group: the picker's option and its card, with its rules", async () => {
    const result = await getSubmitCommunity('defi', 'demo')
    if (!result.ok) throw new Error('expected the community')
    expect(result.data.option).toMatchObject({ slug: 'defi', handle: '#defi', own: false })
    expect(result.data).toMatchObject({ kind: 'group', postable: true, assetClass: null })
    expect(result.data.rules).toContain('No shilling')
    expect(result.data.memberCount).toBeGreaterThan(0)
  })

  it('an asset: its own name and class (Q3)', async () => {
    const result = await getSubmitCommunity('BTC', 'demo')
    expect(result).toMatchObject({
      ok: true,
      data: {
        kind: 'asset',
        subtitle: 'Bitcoin',
        assetClass: 'CRYPTO',
        option: { handle: '$BTC' },
      },
    })
  })

  it("your own channel is postable; someone else's is not", async () => {
    expect(await getSubmitCommunity('demo', 'demo')).toMatchObject({
      ok: true,
      data: { postable: true, option: { own: true } },
    })
    expect(await getSubmitCommunity('maria', 'demo')).toMatchObject({
      ok: true,
      data: { postable: false },
    })
  })

  it('checks the slug before the network', async () => {
    network.calls = 0
    expect((await getSubmitCommunity('../x', 'demo')).ok).toBe(false)
    expect(network.calls).toBe(0)
  })
})
