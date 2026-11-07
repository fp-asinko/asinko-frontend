import type { RawThesis, RawThesisAgreement } from '@/lib/api/contract'
import { mockCaller } from './auth'
import { THESES } from './fixtures/theses'
import type { MockContext, MockResponse } from './types'

// P-043 (proposal, specs/thesis-agree): "Will it happen?" on a thesis. The answers live in this
// process's memory, on top of a stable base per thesis so the feed shows results without anyone
// voting.

type Answer = 'YES' | 'NO'

/** Answers by thesis, then by user. */
const ANSWERS = new Map<string, Map<string, Answer>>()

const error = (status: number, code: string): MockResponse => ({
  status,
  body: { error: { code, message: code } },
})

/**
 * The answers others already gave, from the thesis's id: the same on every request. One in four
 * has none, to show the row before anyone answers.
 */
function baseOf(thesisId: string): { yes: number; no: number } {
  let hash = 0
  for (const char of thesisId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  if (hash % 4 === 0) return { yes: 0, no: 0 }
  return { yes: 3 + (hash % 61), no: 1 + ((hash >>> 8) % 43) }
}

/**
 * Who writes: a mocked token's account, else the `sub` of a real Supabase token (API_MOCKS=missing,
 * development only: not verified), else the demo user.
 */
function callerOf(accessToken: string | null | undefined): string {
  const mocked = mockCaller(accessToken)
  if (!accessToken || accessToken.startsWith('mock-access.')) return mocked
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1] ?? '')) as { sub?: unknown }
    return typeof payload.sub === 'string' ? payload.sub : mocked
  } catch {
    return mocked
  }
}

/** A thesis's answers as `caller` sees them. Without the thesis (a real one), it can vote. */
export function agreementOf(
  thesisId: string,
  caller: string,
  thesis?: Pick<RawThesis, 'state' | 'creator'>,
): RawThesisAgreement {
  const base = baseOf(thesisId)
  const answers = [...(ANSWERS.get(thesisId)?.values() ?? [])]
  return {
    yes: base.yes + answers.filter((each) => each === 'YES').length,
    no: base.no + answers.filter((each) => each === 'NO').length,
    viewerVote: ANSWERS.get(thesisId)?.get(caller) ?? null,
    canVote: !thesis || (thesis.state === 'OPEN' && thesis.creator?.id !== caller),
  }
}

/** A thesis with its answers, as the backend would send them (asSeenBy and the extensions). */
export function withAgreement(
  thesis: RawThesis,
  accessToken: string | null | undefined,
): RawThesis {
  return { ...thesis, agreement: agreementOf(thesis.id, callerOf(accessToken), thesis) }
}

/**
 * The checks of PUT and DELETE: the userId is the caller's, not its author, while open. A thesis the
 * fixtures do not have (the backend's, with API_MOCKS=missing) is taken as open and someone else's.
 */
function check(thesisId: string, userId: unknown, caller: string): MockResponse | null {
  if (userId !== caller) return error(403, 'USER_MISMATCH')
  const thesis = THESES.find((each) => each.id === thesisId)
  if (thesis?.creator?.id === caller) return error(403, 'OWN_THESIS')
  if (thesis && thesis.state !== 'OPEN') return error(409, 'THESIS_CLOSED')
  return null
}

/** PUT /api/v1/theses/{id}/agreement: answers or changes the answer. */
export function answerMockThesis({ params, body, accessToken }: MockContext): MockResponse {
  const thesisId = params.id ?? ''
  const caller = callerOf(accessToken)
  const { userId, value } = (body ?? {}) as { userId?: unknown; value?: unknown }
  const refused = check(thesisId, userId, caller)
  if (refused) return refused
  if (value !== 'YES' && value !== 'NO') return error(422, 'VALIDATION_ERROR')
  if (!ANSWERS.has(thesisId)) ANSWERS.set(thesisId, new Map())
  ANSWERS.get(thesisId)!.set(caller, value)
  return { status: 200, body: agreementOf(thesisId, caller) }
}

/** DELETE /api/v1/theses/{id}/agreement?userId=: takes the answer back. */
export function unanswerMockThesis({ params, query, accessToken }: MockContext): MockResponse {
  const thesisId = params.id ?? ''
  const caller = callerOf(accessToken)
  const refused = check(thesisId, query.userId, caller)
  if (refused) return refused
  ANSWERS.get(thesisId)?.delete(caller)
  return { status: 200, body: agreementOf(thesisId, caller) }
}

/**
 * With API_MOCKS=missing: the backend's theses with their answers (MOCK_EXTENSIONS), in a feed's
 * items or a thesis's page.
 */
export function extendWithAgreement(response: MockResponse, context: MockContext): MockResponse {
  const body = response.body
  if (response.status !== 200 || typeof body !== 'object' || body === null) return response
  if ('items' in body && Array.isArray(body.items)) {
    const items = body.items.map((item: unknown) => {
      const each = item as { kind?: unknown; content?: unknown }
      return each.kind === 'THESIS' && isThesis(each.content)
        ? { ...each, content: withAgreement(each.content, context.accessToken) }
        : item
    })
    return { ...response, body: { ...body, items } }
  }
  return isThesis(body) ? { ...response, body: withAgreement(body, context.accessToken) } : response
}

function isThesis(value: unknown): value is RawThesis {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string' &&
    'state' in value &&
    'deadline' in value
  )
}
