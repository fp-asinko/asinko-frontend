import 'server-only'
import type { z } from 'zod'
import type { MockRoute } from '@/mocks/types'
import {
  isExpectedStatus,
  toExpectedFailure,
  unexpectedFailure,
  type ApiFailure,
  type UnexpectedFailure,
} from './errors'
import { buildPath, type EndpointPattern, type PathParams } from './path'

export type ApiResult<T> = { ok: true; data: T } | ApiFailure

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type ApiRequest<T, P extends EndpointPattern = EndpointPattern> = {
  method: HttpMethod
  /** Contract pattern, e.g. `/api/v1/profiles/:identifier`. Params are encoded by the client. */
  path: P
  /** Raw backend shape. Mandatory: no response is used without validation (F-33). */
  schema: z.ZodType<T>
  query?: Record<string, string>
  body?: unknown
} & PathParams<P>

export type ApiClientOptions = {
  baseUrl: string
  fetch?: typeof fetch
  timeoutMs?: number
  /** Mocked routes (API_MOCKS). A registered route never reaches the network (F-36). */
  mocks?: readonly MockRoute[]
  /** Called for every unexpected failure (5xx, network, timeout, contract drift): reporting. */
  onUnexpected?: (failure: UnexpectedFailure, cause?: unknown) => void
}

const DEFAULT_TIMEOUT_MS = 10_000

type RawResponse = { status: number; body?: unknown }

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

/**
 * HTTP client for asinko-app (design.md §7, api-integration.md). Server-only: the browser never
 * calls the API. It never throws for a request outcome: every failure comes back as a typed result,
 * and unexpected ones are also reported through `onUnexpected`.
 */
export function createApiClient({
  baseUrl,
  fetch: fetchImpl = fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  mocks,
  onUnexpected,
}: ApiClientOptions) {
  function fail(failure: UnexpectedFailure, cause?: unknown): UnexpectedFailure {
    onUnexpected?.(failure, cause)
    return failure
  }

  async function callNetwork(
    method: HttpMethod,
    path: string,
    query: Record<string, string> | undefined,
    body: unknown,
  ): Promise<RawResponse> {
    const url = new URL(path, baseUrl)
    for (const [key, value] of Object.entries(query ?? {})) url.searchParams.set(key, value)

    const response = await fetchImpl(url, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(timeoutMs),
    })
    return { status: response.status, body: await readBody(response) }
  }

  return async function apiRequest<T, P extends EndpointPattern>(
    request: ApiRequest<T, P>,
  ): Promise<ApiResult<T>> {
    const endpoint = `${request.method} ${request.path}`
    const params = (request.params ?? {}) as Record<string, string>
    const path = buildPath(request.path, params)

    // Same handling below for mocked and real responses: a mock exercises validation and errors too.
    const mock = mocks?.find(
      (route) => route.method === request.method && route.path === request.path,
    )

    let raw: RawResponse
    try {
      raw = mock
        ? await mock.handler({ params, query: request.query ?? {}, body: request.body })
        : await callNetwork(request.method, path, request.query, request.body)
    } catch (cause) {
      const timedOut = cause instanceof DOMException && cause.name === 'TimeoutError'
      return fail(unexpectedFailure(endpoint, timedOut ? 'TIMEOUT' : 'NETWORK'), cause)
    }

    if (raw.status >= 200 && raw.status < 300) {
      const parsed = request.schema.safeParse(raw.body)
      if (!parsed.success) {
        // Contract drift: report which fields broke, never the values.
        const fields = parsed.error.issues.map((issue) => issue.path.join('.') || '(root)')
        return fail(unexpectedFailure(endpoint, 'VALIDATION', raw.status), { fields })
      }
      return { ok: true, data: parsed.data }
    }

    if (isExpectedStatus(raw.status)) return toExpectedFailure(endpoint, raw.status, raw.body)

    return fail(unexpectedFailure(endpoint, 'HTTP', raw.status))
  }
}

export type ApiClient = ReturnType<typeof createApiClient>
