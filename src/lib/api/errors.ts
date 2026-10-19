import { apiErrorSchema } from './schemas'

/**
 * Expected backend error codes with a translation under `api.errors.<CODE>`
 * (api-integration.md § Errores). Add codes here and in messages/ together.
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

/** Why an unexpected failure happened. All of them show `api.errors.UNAVAILABLE`. */
export type UnexpectedCode = 'NETWORK' | 'TIMEOUT' | 'HTTP' | 'VALIDATION'

export type ErrorKey = `api.errors.${KnownErrorCode | 'UNKNOWN' | 'UNAVAILABLE'}`

type FailureBase = {
  ok: false
  /** Contract pattern of the endpoint, never the concrete URL (it can carry personal data). */
  endpoint: string
  /** Translation key for the UI. The backend message never reaches the UI. */
  errorKey: ErrorKey
  status?: number
}

/** A business outcome the UI handles (not found, conflict, invalid input…). Not reported. */
export type ExpectedFailure = FailureBase & {
  kind: 'expected'
  code: string
  retryAfter?: string
  /** Which item of a list was refused, and its field (P-028's INVALID_WIDGET). */
  index?: number
  field?: string
}

/** The backend or the network failed, or the contract changed. Reported to Sentry. */
export type UnexpectedFailure = FailureBase & { kind: 'unexpected'; code: UnexpectedCode }

export type ApiFailure = ExpectedFailure | UnexpectedFailure

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
export function toExpectedFailure(
  endpoint: string,
  status: number,
  body: unknown,
): ExpectedFailure {
  const envelope = apiErrorSchema.safeParse(body)
  const code = envelope.success ? envelope.data.error.code : (CODE_BY_STATUS[status] ?? 'UNKNOWN')
  const retryAfter = envelope.success ? envelope.data.error.retryAfter : undefined
  const index = envelope.success ? envelope.data.error.index : undefined
  const field = envelope.success ? envelope.data.error.field : undefined

  return {
    ok: false,
    kind: 'expected',
    endpoint,
    status,
    code,
    errorKey: `api.errors.${isKnownCode(code) ? code : 'UNKNOWN'}`,
    ...(retryAfter ? { retryAfter } : {}),
    ...(index === undefined ? {} : { index }),
    ...(field ? { field } : {}),
  }
}

export function unexpectedFailure(
  endpoint: string,
  code: UnexpectedCode,
  status?: number,
): UnexpectedFailure {
  return {
    ok: false,
    kind: 'unexpected',
    endpoint,
    code,
    errorKey: 'api.errors.UNAVAILABLE',
    ...(status === undefined ? {} : { status }),
  }
}

/** Input rejected locally, before any request (api-integration.md § Validar antes de la red). */
export function invalidInput(endpoint: string): ExpectedFailure {
  return { ok: false, kind: 'expected', endpoint, code: 'INVALID', errorKey: 'api.errors.INVALID' }
}

/** Thrown by getOrThrow() for data a page cannot render without; caught by error.tsx. */
export class ApiRequestError extends Error {
  constructor(readonly failure: ApiFailure) {
    super(`${failure.endpoint} failed: ${failure.kind} ${failure.code}`)
    this.name = 'ApiRequestError'
  }
}
