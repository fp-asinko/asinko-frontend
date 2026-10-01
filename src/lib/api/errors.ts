import { apiErrorSchema } from './schemas'

/**
 * Backend error codes with a translation under `api.errors.<CODE>` (api-integration.md § Errores).
 * A code outside this list falls back to `api.errors.UNKNOWN`. Add codes here and in messages/ together.
 */
export const KNOWN_ERROR_CODES = [
  'UNAUTHENTICATED',
  'NOT_FOUND',
  'USER_MISMATCH',
  'ACCOUNT_DELETED',
  'CONFLICT',
  'INVALID',
  'RATE_LIMITED',
] as const

export type KnownErrorCode = (typeof KNOWN_ERROR_CODES)[number]

/** Expected error: returned, never thrown. Never carries the backend's message. */
export type ApiFailure = {
  ok: false
  status: number
  code: string
  /** Translation key for the UI. */
  errorKey: `api.errors.${KnownErrorCode | 'UNKNOWN'}`
  retryAfter?: string
}

/** Unexpected failure (5xx, network, timeout, contract mismatch): thrown, caught by error.tsx. */
export class ApiUnexpectedError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message)
    this.name = 'ApiUnexpectedError'
  }
}

const EXPECTED_STATUSES = new Set([401, 403, 404, 409, 422, 429])

// Fallback when the body has no valid envelope (e.g. a 422 without a code).
const CODE_BY_STATUS: Record<number, KnownErrorCode> = {
  401: 'UNAUTHENTICATED',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'INVALID',
  429: 'RATE_LIMITED',
}

export function isExpectedStatus(status: number): boolean {
  return EXPECTED_STATUSES.has(status)
}

function isKnownCode(code: string): code is KnownErrorCode {
  return (KNOWN_ERROR_CODES as readonly string[]).includes(code)
}

/** Maps an expected error response (4xx in the table) to a typed failure. */
export function toApiFailure(status: number, body: unknown): ApiFailure {
  const envelope = apiErrorSchema.safeParse(body)
  const code = envelope.success ? envelope.data.error.code : (CODE_BY_STATUS[status] ?? 'UNKNOWN')
  const retryAfter = envelope.success ? envelope.data.error.retryAfter : undefined

  return {
    ok: false,
    status,
    code,
    errorKey: `api.errors.${isKnownCode(code) ? code : 'UNKNOWN'}`,
    ...(retryAfter ? { retryAfter } : {}),
  }
}
