// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'

const env = vi.hoisted(() => ({ API_MOCKS: 'all' as 'off' | 'missing' | 'all' }))
const request = vi.hoisted(() => ({ delay: null as string | null }))
vi.mock('@/env', () => ({ env }))
vi.mock('next/headers', () => ({
  headers: async () => ({
    get: (name: string) => (name === 'x-mock-delay' ? request.delay : null),
  }),
}))

describe('mockDelay', () => {
  afterEach(() => vi.useRealTimers())

  it('waits as long as the header asks, with every route mocked', async () => {
    vi.useFakeTimers()
    request.delay = '300'
    const { mockDelay } = await import('./mock-delay')
    let done = false
    const wait = mockDelay().then(() => (done = true))
    await vi.advanceTimersByTimeAsync(299)
    expect(done).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    await wait
    expect(done).toBe(true)
  })

  it('never waits against a real backend', async () => {
    env.API_MOCKS = 'missing'
    request.delay = '300'
    const { mockDelay } = await import('./mock-delay')
    const started = Date.now()
    await mockDelay()
    expect(Date.now() - started).toBeLessThan(50)
    env.API_MOCKS = 'all'
  })

  it('ignores a missing or invalid header', async () => {
    request.delay = 'abc'
    const { mockDelay } = await import('./mock-delay')
    await expect(mockDelay()).resolves.toBeUndefined()
  })
})
