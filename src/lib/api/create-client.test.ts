// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import en from '../../../messages/en.json'
import { createApiClient } from './create-client'
import { ApiUnexpectedError, KNOWN_ERROR_CODES } from './errors'
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

function clientWith(fetchImpl: typeof fetch) {
  return createApiClient({ baseUrl: BASE_URL, fetch: fetchImpl })
}

const getUser = { method: 'GET', path: '/api/v1/profiles/juan', schema: userSchema } as const

describe('createApiClient', () => {
  it('returns validated data for a 2xx response (F-33)', async () => {
    const api = clientWith(respond(200, { id: 'u1', username: 'juan', extra: 'dropped' }))
    expect(await api(getUser)).toEqual({ ok: true, data: { id: 'u1', username: 'juan' } })
  })

  it('throws when a 2xx response does not match the schema (F-33)', async () => {
    const api = clientWith(respond(200, { id: 1 }))
    await expect(api(getUser)).rejects.toBeInstanceOf(ApiUnexpectedError)
  })

  it('builds the URL with the query and sends JSON bodies', async () => {
    const fetchMock = respond(201, { id: 'u1', username: 'juan' })
    await clientWith(fetchMock)({
      method: 'POST',
      path: '/api/v1/users',
      schema: userSchema,
      body: { username: 'juan' },
      query: { cursor: 'abc' },
    })

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit]
    expect(url.toString()).toBe('https://api.example.com/api/v1/users?cursor=abc')
    expect(init.method).toBe('POST')
    expect(init.body).toBe('{"username":"juan"}')
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' })
    expect(init.cache).toBe('no-store')
  })

  it('supports 204 No Content', async () => {
    const api = clientWith(respond(204))
    const result = await api({
      method: 'DELETE',
      path: '/api/v1/users/u1',
      schema: noContentSchema,
    })
    expect(result).toEqual({ ok: true, data: undefined })
  })

  it('validates paginated lists', async () => {
    const api = clientWith(
      respond(200, { items: [{ id: 'u1', username: 'juan' }], nextCursor: null }),
    )
    const result = await api({
      method: 'GET',
      path: '/api/v1/users/u1/followers',
      schema: paginatedSchema(userSchema),
    })
    expect(result).toEqual({
      ok: true,
      data: { items: [{ id: 'u1', username: 'juan' }], nextCursor: null },
    })
  })

  describe('expected errors become typed results (F-34)', () => {
    it.each([
      [401, 'UNAUTHENTICATED'],
      [403, 'USER_MISMATCH'],
      [403, 'ACCOUNT_DELETED'],
      [404, 'NOT_FOUND'],
      [409, 'CONFLICT'],
    ])('%i %s maps to its translation key', async (status, code) => {
      const api = clientWith(respond(status, { error: { code, message: 'internal detail' } }))
      expect(await api(getUser)).toEqual({
        ok: false,
        status,
        code,
        errorKey: `api.errors.${code}`,
      })
    })

    it('never exposes the backend message', async () => {
      const api = clientWith(
        respond(409, { error: { code: 'CONFLICT', message: 'SQL: duplicate key' } }),
      )
      expect(JSON.stringify(await api(getUser))).not.toContain('SQL')
    })

    it('keeps retryAfter on 429', async () => {
      const api = clientWith(
        respond(429, {
          error: {
            code: 'USERNAME_CHANGE_TOO_SOON',
            message: 'x',
            retryAfter: '2027-01-01T00:00:00Z',
          },
        }),
      )
      expect(await api(getUser)).toMatchObject({
        status: 429,
        retryAfter: '2027-01-01T00:00:00Z',
      })
    })

    it('falls back to api.errors.UNKNOWN for an unknown code', async () => {
      const api = clientWith(respond(409, { error: { code: 'SLUG_TAKEN', message: 'x' } }))
      expect(await api(getUser)).toMatchObject({
        code: 'SLUG_TAKEN',
        errorKey: 'api.errors.UNKNOWN',
      })
    })

    it('derives the code from the status when the body has no envelope', async () => {
      const api = clientWith(respond(422, { detail: 'bad' }))
      expect(await api(getUser)).toMatchObject({ code: 'INVALID', errorKey: 'api.errors.INVALID' })
    })
  })

  describe('unexpected failures are thrown (F-34)', () => {
    it.each([500, 502, 503])('throws on %i', async (status) => {
      const api = clientWith(respond(status, { error: { code: 'INTERNAL', message: 'boom' } }))
      await expect(api(getUser)).rejects.toMatchObject({ name: 'ApiUnexpectedError', status })
    })

    it('throws on a network error or timeout', async () => {
      const api = clientWith(
        vi.fn<typeof fetch>(async () => {
          throw new DOMException('The operation timed out.', 'TimeoutError')
        }),
      )
      await expect(api(getUser)).rejects.toBeInstanceOf(ApiUnexpectedError)
    })
  })
})

describe('error translations', () => {
  it('has a message for every known code and for UNKNOWN', () => {
    const keys = Object.keys(en.api.errors)
    expect(keys).toEqual(expect.arrayContaining([...KNOWN_ERROR_CODES, 'UNKNOWN']))
  })
})
