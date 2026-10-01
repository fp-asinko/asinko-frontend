import 'server-only'
import type { z } from 'zod'
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

/** HTTP client for asinko-app (design.md §7). Server-only: the browser never calls the API. */
export function createApiClient({
  baseUrl,
  fetch: fetchImpl = fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: ApiClientOptions) {
  return async function apiRequest<T>(request: ApiRequest<T>): Promise<ApiResult<T>> {
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

    const body = await readBody(response)

    if (response.ok) {
      const parsed = request.schema.safeParse(body)
      if (!parsed.success) {
        throw new ApiUnexpectedError(
          `${request.method} ${request.path} returned an unexpected shape`,
          response.status,
        )
      }
      return { ok: true, data: parsed.data }
    }

    if (isExpectedStatus(response.status)) return toApiFailure(response.status, body)

    throw new ApiUnexpectedError(
      `${request.method} ${request.path} responded ${response.status}`,
      response.status,
    )
  }
}

export type ApiClient = ReturnType<typeof createApiClient>
