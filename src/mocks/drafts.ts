import type { RawDraft } from '@/lib/api/contract'
import { DEMO_USER } from './demo-user'
import { communityById, communitySummary } from './fixtures/communities'
import { mockId } from './fixtures/ids'
import type { MockResponse } from './types'

// A person's drafts (P-022, proposal, specs/drafts-tags), for the demo viewer: in this process's
// memory, newest first, up to 20, as the proposal says.

export const DRAFTS_MAX = 20

/** One draft from before, so the list has something to show (and the examples a draft to use). */
export const SEED_DRAFT_ID = mockId(8, 900)

const DRAFTS: RawDraft[] = [
  {
    id: SEED_DRAFT_ID,
    type: 'TEXT',
    title: 'The second Fed cut is already priced in',
    body: 'Fed funds futures give it 80%. What is left for risk assets?',
    url: '',
    imageUrl: null,
    imageAlt: '',
    tag: 'Analysis',
    community: communitySummary('macro'),
    updatedAt: new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
  },
]
let created = 0

const error = (status: number, code: string): MockResponse => ({
  status,
  body: { error: { code, message: 'mock' } },
})

const text = (value: unknown) => (typeof value === 'string' ? value : '')

/** The fields a draft takes, checked as the backend would; null when something is off. */
function fields(input: Record<string, unknown>): Omit<RawDraft, 'id' | 'updatedAt'> | null {
  const type = input.type ?? 'TEXT'
  if (type !== 'TEXT' && type !== 'LINK' && type !== 'IMAGE') return null
  if (text(input.title).length > 300) return null
  const community =
    typeof input.communityId === 'string' ? communityById(input.communityId) : undefined
  if (input.communityId !== undefined && input.communityId !== null && !community) return null
  return {
    type,
    title: text(input.title),
    body: text(input.body),
    url: text(input.url),
    imageUrl: typeof input.imageUrl === 'string' ? input.imageUrl : null,
    imageAlt: text(input.imageAlt),
    tag: typeof input.tag === 'string' ? input.tag : null,
    community: community ? communitySummary(community.slug) : null,
  }
}

/** GET /users/{userId}/drafts */
export function listDrafts(userId: string): MockResponse {
  if (userId !== DEMO_USER.id) return error(403, 'USER_MISMATCH')
  return { status: 200, body: { items: DRAFTS, nextCursor: null } }
}

/** POST /drafts */
export function createDraft(body: unknown): MockResponse {
  const input = (body ?? {}) as Record<string, unknown>
  if (input.userId !== DEMO_USER.id) return error(403, 'USER_MISMATCH')
  if (DRAFTS.length >= DRAFTS_MAX) return error(409, 'DRAFT_LIMIT')
  const values = fields(input)
  if (!values) return error(422, 'VALIDATION_ERROR')
  created += 1
  const draft: RawDraft = { id: mockId(8, created), ...values, updatedAt: new Date().toISOString() }
  DRAFTS.unshift(draft)
  return { status: 201, body: draft }
}

/** PATCH /drafts/{draftId} */
export function updateDraft(draftId: string, body: unknown): MockResponse {
  const input = (body ?? {}) as Record<string, unknown>
  if (input.userId !== DEMO_USER.id) return error(403, 'USER_MISMATCH')
  const index = DRAFTS.findIndex((each) => each.id === draftId)
  if (index === -1) return error(404, 'NOT_FOUND')
  const values = fields(input)
  if (!values) return error(422, 'VALIDATION_ERROR')
  const draft: RawDraft = { id: draftId, ...values, updatedAt: new Date().toISOString() }
  // The newest first: an updated draft goes to the top.
  DRAFTS.splice(index, 1)
  DRAFTS.unshift(draft)
  return { status: 200, body: draft }
}

/** DELETE /drafts/{draftId}?userId= */
export function deleteDraft(draftId: string, userId: string | undefined): MockResponse {
  if (userId !== DEMO_USER.id) return error(403, 'USER_MISMATCH')
  const index = DRAFTS.findIndex((each) => each.id === draftId)
  if (index === -1) return error(404, 'NOT_FOUND')
  DRAFTS.splice(index, 1)
  return { status: 204 }
}
