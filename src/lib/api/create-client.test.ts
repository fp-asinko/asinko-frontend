// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import en from '../../../messages/en.json'
import type { MockRoute } from '@/mocks/types'
import { createApiClient } from './create-client'
import { KNOWN_ERROR_CODES } from './errors'
import { noContentSchema, paginatedSchema } from './schemas'

const BASE_URL = 'https://api.example.com'
const userSchema = z.object({ id: z.string(), username: z.string() })

function respond(status: number, body?: unknown) {
  return vi.fn<typeof fetch>(async () =>
    body === undefined
      ? new Response(null, { status })
      : new Response(JSON.stringify(body), {
          status,
          headers: { 'Content-Type': 'application/json' },
        }),
  )
}

function clientWith(fetchImpl: typeof fetch, onUnexpected = vi.fn()) {
  return {
    api: createApiClient({ baseUrl: BASE_URL, fetch: fetchImpl, onUnexpected }),
    onUnexpected,
  }
}

const getProfile = {
  method: 'GET',
  path: '/api/v1/profiles/:identifier',
  params: { identifier: 'juan' },
  schema: userSchema,
} as const

describe('createApiClient', () => {
  it('returns validated data for a 2xx response (F-33)', async () => {
    const { api } = clientWith(respond(200, { id: 'u1', username: 'juan', extra: 'dropped' }))
    expect(await api(getProfile)).toEqual({ ok: true, data: { id: 'u1', username: 'juan' } })
  })

  it('encodes path params, builds the query and sends JSON bodies', async () => {
    const fetchMock = respond(201, { id: 'u1', username: 'juan' })
    await clientWith(fetchMock).api({
      method: 'POST',
      path: '/api/v1/communities/:slug/members/:targetUserId',
      params: { slug: '../admin', targetUserId: 'u1' },
      schema: userSchema,
      body: { userId: 'u1' },
      query: { cursor: 'abc' },
    })

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit]
    expect(url.toString()).toBe(
      'https://api.example.com/api/v1/communities/..%2Fadmin/members/u1?cursor=abc',
    )
    expect(init.method).toBe('POST')
    expect(init.body).toBe('{"userId":"u1"}')
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' })
    expect(init.cache).toBe('no-store')
  })

  it('supports 204 No Content', async () => {
    const { api } = clientWith(respond(204))
    const result = await api({
      method: 'DELETE',
      path: '/api/v1/users/:userId',
      params: { userId: 'u1' },
      schema: noContentSchema,
    })
    expect(result).toEqual({ ok: true, data: undefined })
  })

  it('validates paginated lists', async () => {
    const { api } = clientWith(
      respond(200, { items: [{ id: 'u1', username: 'juan' }], nextCursor: null }),
    )
    const result = await api({
      method: 'GET',
      path: '/api/v1/users/:userId/followers',
      params: { userId: 'u1' },
      schema: paginatedSchema(userSchema),
    })
    expect(result).toEqual({
      ok: true,
      data: { items: [{ id: 'u1', username: 'juan' }], nextCursor: null },
    })
  })

  describe('expected errors are typed results, not reported (F-34)', () => {
    it.each([
      [401, 'UNAUTHENTICATED'],
      [403, 'USER_MISMATCH'],
      [403, 'ACCOUNT_DELETED'],
      [404, 'NOT_FOUND'],
      [409, 'CONFLICT'],
    ])('%i %s maps to its translation key', async (status, code) => {
      const { api, onUnexpected } = clientWith(
        respond(status, { error: { code, message: 'internal detail' } }),
      )
      expect(await api(getProfile)).toEqual({
        ok: false,
        kind: 'expected',
        endpoint: 'GET /api/v1/profiles/:identifier',
        status,
        code,
        errorKey: `api.errors.${code}`,
      })
      expect(onUnexpected).not.toHaveBeenCalled()
    })

    it('never exposes the backend message', async () => {
      const { api } = clientWith(
        respond(409, { error: { code: 'CONFLICT', message: 'SQL: duplicate' } }),
      )
      expect(JSON.stringify(await api(getProfile))).not.toContain('SQL')
    })

    it('keeps retryAfter on 429', async () => {
      const { api } = clientWith(
        respond(429, {
          error: {
            code: 'USERNAME_CHANGE_TOO_SOON',
            message: 'x',
            retryAfter: '2027-01-01T00:00:00Z',
          },
        }),
      )
      expect(await api(getProfile)).toMatchObject({
        status: 429,
        retryAfter: '2027-01-01T00:00:00Z',
      })
    })

    it('falls back to api.errors.UNKNOWN for an unknown code', async () => {
      const { api } = clientWith(respond(409, { error: { code: 'SLUG_TAKEN', message: 'x' } }))
      expect(await api(getProfile)).toMatchObject({
        code: 'SLUG_TAKEN',
        errorKey: 'api.errors.UNKNOWN',
      })
    })

    it('derives the code from the status when the body has no envelope', async () => {
      const { api } = clientWith(respond(422, { detail: 'bad' }))
      expect(await api(getProfile)).toMatchObject({
        code: 'INVALID',
        errorKey: 'api.errors.INVALID',
      })
    })
  })

  describe('unexpected failures are results too, and get reported', () => {
    it.each([500, 502, 503])('HTTP %i', async (status) => {
      const { api, onUnexpected } = clientWith(respond(status, { error: { code: 'INTERNAL' } }))
      const result = await api(getProfile)
      expect(result).toEqual({
        ok: false,
        kind: 'unexpected',
        endpoint: 'GET /api/v1/profiles/:identifier',
        code: 'HTTP',
        status,
        errorKey: 'api.errors.UNAVAILABLE',
      })
      expect(onUnexpected).toHaveBeenCalledWith(result, undefined)
    })

    it('VALIDATION when a 2xx does not match the schema, reporting fields but not values', async () => {
      const { api, onUnexpected } = clientWith(respond(200, { id: 1, username: 'secret-value' }))
      expect(await api(getProfile)).toMatchObject({ kind: 'unexpected', code: 'VALIDATION' })
      const cause = onUnexpected.mock.calls[0]?.[1]
      expect(cause).toEqual({ fields: ['id'] })
      expect(JSON.stringify(onUnexpected.mock.calls)).not.toContain('secret-value')
    })

    it('TIMEOUT when the request times out', async () => {
      const { api } = clientWith(
        vi.fn<typeof fetch>(async () => {
          throw new DOMException('The operation timed out.', 'TimeoutError')
        }),
      )
      expect(await api(getProfile)).toMatchObject({ kind: 'unexpected', code: 'TIMEOUT' })
    })

    it('NETWORK when the connection fails', async () => {
      const { api } = clientWith(
        vi.fn<typeof fetch>(async () => {
          throw new TypeError('fetch failed')
        }),
      )
      expect(await api(getProfile)).toMatchObject({ kind: 'unexpected', code: 'NETWORK' })
    })

    it('identifies the endpoint by its pattern, never by the concrete URL', async () => {
      const { api, onUnexpected } = clientWith(respond(500))
      await api({ ...getProfile, params: { identifier: 'juan.perez@example.com' } })
      expect(JSON.stringify(onUnexpected.mock.calls)).not.toContain('juan.perez')
    })
  })
})

describe('mocks (F-36)', () => {
  const profileMock: MockRoute = {
    method: 'GET',
    path: '/api/v1/profiles/:identifier',
    kind: 'contract',
    implemented: true,
    schema: userSchema,
    example: { params: { identifier: 'juan' }, query: {}, body: undefined },
    handler: ({ params }) =>
      params.identifier === 'juan'
        ? { status: 200, body: { id: 'u1', username: 'juan' } }
        : { status: 404, body: { error: { code: 'NOT_FOUND', message: 'mock' } } },
  }

  it('answers a registered route without touching the network', async () => {
    const fetchMock = respond(500)
    const api = createApiClient({ baseUrl: BASE_URL, fetch: fetchMock, mocks: [profileMock] })
    expect(await api(getProfile)).toEqual({ ok: true, data: { id: 'u1', username: 'juan' } })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sends unregistered routes to the real API', async () => {
    const fetchMock = respond(200, { id: 'u2', username: 'ana' })
    const api = createApiClient({ baseUrl: BASE_URL, fetch: fetchMock, mocks: [profileMock] })
    await api({
      method: 'GET',
      path: '/api/v1/users/:userId',
      params: { userId: 'u2' },
      schema: userSchema,
    })
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('applies the same error mapping to mocked errors', async () => {
    const api = createApiClient({ baseUrl: BASE_URL, fetch: respond(500), mocks: [profileMock] })
    expect(await api({ ...getProfile, params: { identifier: 'nobody' } })).toMatchObject({
      ok: false,
      errorKey: 'api.errors.NOT_FOUND',
    })
  })
})

describe('error translations', () => {
  it('has a message for every known code, UNAVAILABLE and UNKNOWN', () => {
    expect(Object.keys(en.api.errors)).toEqual(
      expect.arrayContaining([...KNOWN_ERROR_CODES, 'UNAVAILABLE', 'UNKNOWN']),
    )
  })
})

describe('getHeaders (specs/dev-login DL-04)', () => {
  it('adds the session headers to every network request', async () => {
    const fetchImpl = vi.fn(
      async (_input: string | URL, _init?: RequestInit) =>
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
    )
    const api = createApiClient({
      baseUrl: 'http://backend.test',
      fetch: fetchImpl as unknown as typeof fetch,
      getHeaders: async () => ({ Authorization: 'Bearer token-123' }),
    })
    await api({ method: 'GET', path: '/api/v1/communities', schema: z.unknown() })
    expect(fetchImpl.mock.calls[0]?.[1]).toMatchObject({
      headers: { Authorization: 'Bearer token-123', Accept: 'application/json' },
    })
  })
})
