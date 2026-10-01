import 'server-only'
import type { z } from 'zod'
import { findMock } from '@/mocks/match'
import type { MockRoute } from '@/mocks/types'
import { ApiUnexpectedError, isExpectedStatus, toApiFailure, type ApiFailure } from './errors'

export type ApiResult<T> = { ok: true; data: T } | ApiFailure

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type ApiRequest<T> = {
  method: HttpMethod
  path: `/api/v1/${string}`
  /** Mandatory: no response is used without validation (F-33). */
  schema: z.ZodType<T>
  body?: unknown
  query?: Record<string, string>
}

export type ApiClientOptions = {
  baseUrl: string
  fetch?: typeof fetch
  timeoutMs?: number
  /** Mocked routes (API_MOCKS). A registered route never reaches the network (F-36). */
  mocks?: readonly MockRoute[]
}

const DEFAULT_TIMEOUT_MS = 10_000

async function readBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined
  const text = await response.text()
  if (!text) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

type RawResponse = { status: number; body: unknown }

/** HTTP client for asinko-app (design.md §7). Server-only: the browser never calls the API. */
export function createApiClient({
  baseUrl,
  fetch: fetchImpl = fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  mocks,
}: ApiClientOptions) {
  async function callNetwork<T>(request: ApiRequest<T>): Promise<RawResponse> {
    const url = new URL(request.path, baseUrl)
    for (const [key, value] of Object.entries(request.query ?? {})) url.searchParams.set(key, value)

    let response: Response
    try {
      response = await fetchImpl(url, {
        method: request.method,
        headers: {
          Accept: 'application/json',
          ...(request.body === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        body: request.body === undefined ? undefined : JSON.stringify(request.body),
        cache: 'no-store',
        signal: AbortSignal.timeout(timeoutMs),
      })
    } catch (cause) {
      throw new ApiUnexpectedError(`${request.method} ${request.path} failed: ${String(cause)}`)
    }
    return { status: response.status, body: await readBody(response) }
  }

  return async function apiRequest<T>(request: ApiRequest<T>): Promise<ApiResult<T>> {
    // Same handling below for mocked and real responses: a mock exercises validation and errors too.
    const mock = mocks ? findMock(mocks, request.method, request.path) : null
    const { status, body } = mock
      ? await mock.route.handler({
          params: mock.params,
          query: request.query ?? {},
          body: request.body,
        })
      : await callNetwork(request)

    if (status >= 200 && status < 300) {
      const parsed = request.schema.safeParse(body)
      if (!parsed.success) {
        throw new ApiUnexpectedError(
          `${request.method} ${request.path} returned an unexpected shape`,
          status,
        )
      }
      return { ok: true, data: parsed.data }
    }

    if (isExpectedStatus(status)) return toApiFailure(status, body)

    throw new ApiUnexpectedError(`${request.method} ${request.path} responded ${status}`, status)
  }
}

export type ApiClient = ReturnType<typeof createApiClient>
