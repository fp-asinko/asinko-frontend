// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MAX_IMPRESSIONS_BYTES, receiveImpressions } from './receive-impressions'

const mocks = vi.hoisted(() => ({ getViewer: vi.fn(), reportImpressionsAs: vi.fn() }))
vi.mock('@/lib/session', () => ({ getViewer: mocks.getViewer }))
vi.mock('./impressions-api', () => ({ reportImpressionsAs: mocks.reportImpressionsAs }))

const REQUEST_ID = '00000000-0000-4000-8000-000000000001'
const CONTENT_ID = '11111111-1111-4111-8111-111111111111'
const body = {
  requestId: REQUEST_ID,
  events: [{ contentId: CONTENT_ID, type: 'SEEN', dwellMs: 1200 }],
}

function post(payload: unknown = body, headers: Record<string, string> = {}): Request {
  const text = typeof payload === 'string' ? payload : JSON.stringify(payload)
  return new Request('https://asinko.app/api/impressions', {
    method: 'POST',
    body: text,
    headers: {
      origin: 'https://asinko.app',
      host: 'asinko.app',
      'content-type': 'text/plain;charset=UTF-8',
      ...headers,
    },
  })
}

describe('receiveImpressions (specs/explore-v1 EX-08 to EX-10)', () => {
  beforeEach(() => {
    mocks.getViewer.mockReset().mockResolvedValue({ id: 'user-1', username: 'demo' })
    mocks.reportImpressionsAs.mockReset().mockResolvedValue({ ok: true, data: undefined })
  })

  it("sends the page's events with the session's userId, as a beacon's text or as JSON", async () => {
    expect((await receiveImpressions(post())).status).toBe(204)
    expect(mocks.reportImpressionsAs).toHaveBeenCalledWith('user-1', body)
    const json = post(body, { 'content-type': 'application/json' })
    expect((await receiveImpressions(json)).status).toBe(204)
  })

  it('sends null without a session', async () => {
    mocks.getViewer.mockResolvedValue(null)
    await receiveImpressions(post())
    expect(mocks.reportImpressionsAs).toHaveBeenCalledWith(null, body)
  })

  it('never takes a userId from the browser', async () => {
    const forged = await receiveImpressions(post({ ...body, userId: 'someone-else' }))
    expect(forged.status).toBe(400)
    expect(mocks.reportImpressionsAs).not.toHaveBeenCalled()
  })

  it('answers 204 although the backend fails: an impression is never noticed (EX-09)', async () => {
    mocks.reportImpressionsAs.mockResolvedValue({ ok: false, kind: 'unexpected', code: 'HTTP' })
    expect((await receiveImpressions(post())).status).toBe(204)
  })

  it('refuses another site, or a request without an origin (CSRF)', async () => {
    for (const headers of [
      { origin: 'https://evil.example' },
      { origin: 'null' },
      { origin: '' },
    ]) {
      expect((await receiveImpressions(post(body, headers))).status).toBe(403)
    }
    // Behind a proxy, the host the browser reached.
    const proxied = post(body, { host: 'internal:3000', 'x-forwarded-host': 'asinko.app' })
    expect((await receiveImpressions(proxied)).status).toBe(204)
    expect(mocks.reportImpressionsAs).toHaveBeenCalledTimes(1)
  })

  it('refuses another content type, a body too big and one that is not the contract', async () => {
    const form = post(body, { 'content-type': 'application/x-www-form-urlencoded' })
    expect((await receiveImpressions(form)).status).toBe(415)
    const big = post('x'.repeat(MAX_IMPRESSIONS_BYTES + 1))
    expect((await receiveImpressions(big)).status).toBe(413)
    for (const bad of [
      'not json',
      { requestId: 'nope', events: body.events },
      { requestId: REQUEST_ID, events: [] },
      { requestId: REQUEST_ID, events: [{ contentId: CONTENT_ID, type: 'CLICK' }] },
    ]) {
      expect((await receiveImpressions(post(bad))).status).toBe(400)
    }
    expect(mocks.reportImpressionsAs).not.toHaveBeenCalled()
  })
})
