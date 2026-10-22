import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const PAGE_A = '00000000-0000-4000-8000-000000000001'
const PAGE_B = '00000000-0000-4000-8000-000000000002'
const id = (n: number) => `11111111-1111-4111-8111-${String(n).padStart(12, '0')}`

/** A fresh queue for each test: it lives in the module. */
async function queue() {
  vi.resetModules()
  return import('./impression-queue')
}

const sent = (beacon: ReturnType<typeof vi.fn>) =>
  beacon.mock.calls.map(([url, body]) => ({ url, ...JSON.parse(body as string) }))

describe('impression queue (specs/explore-v1 EX-07, EX-09)', () => {
  let beacon: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    beacon = vi.fn(() => true)
    vi.stubGlobal('navigator', { ...navigator, sendBeacon: beacon })
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('waits for company, then sends one batch per page, as a beacon', async () => {
    const { trackImpression, FLUSH_MS, IMPRESSIONS_ENDPOINT } = await queue()
    trackImpression(PAGE_A, { contentId: id(1), type: 'SEEN', dwellMs: 1200 })
    trackImpression(PAGE_B, { contentId: id(2), type: 'OPEN' })
    trackImpression(PAGE_A, { contentId: id(3), type: 'SEEN', dwellMs: 3000 })
    expect(beacon).not.toHaveBeenCalled()

    vi.advanceTimersByTime(FLUSH_MS)
    expect(sent(beacon)).toEqual([
      {
        url: IMPRESSIONS_ENDPOINT,
        requestId: PAGE_A,
        events: [
          { contentId: id(1), type: 'SEEN', dwellMs: 1200 },
          { contentId: id(3), type: 'SEEN', dwellMs: 3000 },
        ],
      },
      {
        url: IMPRESSIONS_ENDPOINT,
        requestId: PAGE_B,
        events: [{ contentId: id(2), type: 'OPEN' }],
      },
    ])
    // Sent once: nothing left.
    vi.advanceTimersByTime(FLUSH_MS)
    expect(beacon).toHaveBeenCalledTimes(2)
  })

  it('sends at once when a page reaches 100 events', async () => {
    const { trackImpression } = await queue()
    for (let n = 0; n < 100; n++) trackImpression(PAGE_A, { contentId: id(n), type: 'SEEN' })
    expect(beacon).toHaveBeenCalledTimes(1)
    expect(sent(beacon)[0]!.events).toHaveLength(100)
  })

  it('sends what waits when the page is hidden or left', async () => {
    const { trackImpression } = await queue()
    trackImpression(PAGE_A, { contentId: id(1), type: 'OPEN' })
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
    expect(beacon).toHaveBeenCalledTimes(1)

    trackImpression(PAGE_A, { contentId: id(2), type: 'OPEN' })
    window.dispatchEvent(new Event('pagehide'))
    expect(beacon).toHaveBeenCalledTimes(2)
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
  })

  it('falls back to a keepalive fetch, and drops a failure without retrying', async () => {
    beacon.mockReturnValue(false)
    const fetch = vi.fn(() => Promise.reject(new Error('offline')))
    vi.stubGlobal('fetch', fetch)
    const { trackImpression, flushImpressions } = await queue()
    trackImpression(PAGE_A, { contentId: id(1), type: 'OPEN' })
    flushImpressions()
    expect(fetch).toHaveBeenCalledWith(
      '/api/impressions',
      expect.objectContaining({ method: 'POST', keepalive: true }),
    )
    await vi.runAllTimersAsync()
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})

describe('impression queue and contract', () => {
  it("batches as many events as the contract takes, without importing it (zod stays off the browser's bundle)", async () => {
    const { MAX_IMPRESSION_EVENTS } = await import('@/lib/api/contract')
    const { BATCH_SIZE } = await import('./impression-queue')
    expect(BATCH_SIZE).toBe(MAX_IMPRESSION_EVENTS)
  })
})
