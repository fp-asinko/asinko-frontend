import type { RawDraft } from '@/lib/api/contract'
import { mockCaller } from './auth'
import { DEMO_USER } from './demo-user'
import { postDraftCount } from './drafts'
import { communityById, communitySummary } from './fixtures/communities'
import { mockId } from './fixtures/ids'
import type { MockContext, MockResponse } from './types'

// A thesis's drafts (P-038, proposal, specs/thesis-drafts): in this process's memory, per person.
// With API_MOCKS=missing only these are mocked; a post's still go to the backend.

const NAMESPACE = 42
const LIMIT = 20

/** One from before for the demo user, so the list has a thesis and the examples a draft. */
export const SEED_THESIS_DRAFT_ID = mockId(NAMESPACE, 900)

const DRAFTS = new Map<string, RawDraft[]>([
  [
    DEMO_USER.id,
    [
      {
        id: SEED_THESIS_DRAFT_ID,
        type: 'THESIS',
        title: 'ETH closes the year above 5K',
        body: 'Staking yield and the ETF flows.',
        url: '',
        imageUrl: null,
        imageAlt: '',
        tag: null,
        community: communitySummary('ETH'),
        related: [],
        thesis: {
          assetSymbol: 'ETH',
          targetPrice: 5000,
          targetDirection: 'ABOVE',
          deadline: null,
          conviction: 'MEDIUM',
        },
        createdAt: new Date(Date.now() - 5 * 60 * 60_000).toISOString(),
        updatedAt: new Date(Date.now() - 4 * 60 * 60_000).toISOString(),
      },
    ],
  ],
])
let created = 0

const error = (status: number, code: string): MockResponse => ({
  status,
  body: { error: { code, message: 'mock' } },
})

const text = (value: unknown) => (typeof value === 'string' ? value : '')

/** These ids: mockId(42, n), from …-000000042000 to …-000000042999. */
const THESIS_DRAFT_ID = /^00000000-0000-4000-8000-000000042\d{3}$/

/** Whether a draft id is one of these (a mocked route takes it). */
export function isThesisDraftId(id: string | undefined): boolean {
  return THESIS_DRAFT_ID.test(id ?? '')
}

/** A person's thesis drafts, newest first. */
export function thesisDraftsOf(userId: string): RawDraft[] {
  return DRAFTS.get(userId) ?? []
}

/** The thesis's fields, checked as the backend would (P-038); null when something is off. */
function values(
  input: Record<string, unknown>,
): Omit<RawDraft, 'id' | 'createdAt' | 'updatedAt'> | null {
  if (text(input.title).length > 280) return null
  const community =
    typeof input.communityId === 'string' ? communityById(input.communityId) : undefined
  if (input.communityId !== undefined && input.communityId !== null && !community) return null
  const raw = (input.thesis ?? {}) as Record<string, unknown>
  const directions = ['ABOVE', 'BELOW']
  const convictions = ['LOW', 'MEDIUM', 'HIGH', 'EXTREME']
  const thesis = {
    assetSymbol: typeof raw.assetSymbol === 'string' ? raw.assetSymbol : null,
    targetPrice: typeof raw.targetPrice === 'number' ? raw.targetPrice : null,
    targetDirection: directions.includes(String(raw.targetDirection))
      ? (raw.targetDirection as 'ABOVE' | 'BELOW')
      : null,
    deadline: typeof raw.deadline === 'string' ? raw.deadline : null,
    conviction: convictions.includes(String(raw.conviction))
      ? (raw.conviction as NonNullable<RawDraft['thesis']>['conviction'])
      : null,
  }
  return {
    type: 'THESIS',
    title: text(input.title),
    body: text(input.body),
    url: '',
    imageUrl: null,
    imageAlt: '',
    tag: null,
    community: community ? communitySummary(community.slug) : null,
    related: [],
    thesis,
  }
}

/** POST /drafts with type THESIS. The limit of 20 is of all the person's drafts. */
export function createThesisDraft({ body, accessToken }: MockContext): MockResponse {
  const input = (body ?? {}) as Record<string, unknown>
  const caller = mockCaller(accessToken)
  if (input.userId !== caller) return error(403, 'USER_MISMATCH')
  const mine = thesisDraftsOf(caller)
  const posts = caller === DEMO_USER.id ? postDraftCount() : 0
  if (mine.length + posts >= LIMIT) return error(409, 'DRAFT_LIMIT')
  const fields = values(input)
  if (!fields) return error(422, 'VALIDATION_ERROR')
  created += 1
  const now = new Date().toISOString()
  const draft: RawDraft = {
    id: mockId(NAMESPACE, created),
    ...fields,
    createdAt: now,
    updatedAt: now,
  }
  DRAFTS.set(caller, [draft, ...mine])
  return { status: 201, body: draft }
}

/** PATCH /drafts/{draftId} of a thesis draft: it goes first. */
export function updateThesisDraft({ params, body, accessToken }: MockContext): MockResponse {
  const input = (body ?? {}) as Record<string, unknown>
  const caller = mockCaller(accessToken)
  if (input.userId !== caller) return error(403, 'USER_MISMATCH')
  const mine = thesisDraftsOf(caller)
  const old = mine.find((each) => each.id === params.draftId)
  if (!old) return error(404, 'NOT_FOUND')
  const fields = values(input)
  if (!fields) return error(422, 'VALIDATION_ERROR')
  const draft: RawDraft = {
    id: old.id,
    ...fields,
    createdAt: old.createdAt,
    updatedAt: new Date().toISOString(),
  }
  DRAFTS.set(caller, [draft, ...mine.filter((each) => each.id !== old.id)])
  return { status: 200, body: draft }
}

/** DELETE /drafts/{draftId}?userId= of a thesis draft; 204 also when it was already gone. */
export function deleteThesisDraft({ params, query, accessToken }: MockContext): MockResponse {
  const caller = mockCaller(accessToken)
  if (query.userId !== caller) return error(403, 'USER_MISMATCH')
  DRAFTS.set(
    caller,
    thesisDraftsOf(caller).filter((each) => each.id !== params.draftId),
  )
  return { status: 204 }
}

/** The person's draft by its id, to publish it (POST /theses with draftId, P-038). */
export function takeThesisDraft(draftId: string, userId: string): boolean {
  const mine = thesisDraftsOf(userId)
  if (!mine.some((each) => each.id === draftId)) return false
  DRAFTS.set(
    userId,
    mine.filter((each) => each.id !== draftId),
  )
  return true
}

/** A list of drafts with these added, newest first (the backend's, or the mocked posts'). */
export function withThesisDrafts(drafts: readonly RawDraft[], userId: string): RawDraft[] {
  return [...drafts, ...thesisDraftsOf(userId)].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  )
}
