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
    related: [],
    createdAt: new Date(Date.now() - 3 * 60 * 60_000).toISOString(),
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
function fields(
  input: Record<string, unknown>,
): Omit<RawDraft, 'id' | 'createdAt' | 'updatedAt'> | null {
  const type = input.type ?? 'TEXT'
  if (type !== 'TEXT' && type !== 'LINK' && type !== 'IMAGE') return null
  if (text(input.title).length > 300) return null
  const community =
    typeof input.communityId === 'string' ? communityById(input.communityId) : undefined
  if (input.communityId !== undefined && input.communityId !== null && !community) return null
  // P-018 (backend 2026-10-20): its related ones, up to 3, checked fully when it is published.
  const ids = Array.isArray(input.relatedCommunityIds) ? input.relatedCommunityIds : []
  if (ids.length > 3) return null
  const related = ids.flatMap((id) => {
    const each = communityById(String(id))
    if (!each) return []
    const { slug, name, type, avatarUrl } = each
    return [{ id: each.id, slug, name, type, avatarUrl }]
  })
  return {
    type,
    title: text(input.title),
    body: text(input.body),
    url: text(input.url),
    imageUrl: typeof input.imageUrl === 'string' ? input.imageUrl : null,
    imageAlt: text(input.imageAlt),
    tag: typeof input.tag === 'string' ? input.tag : null,
    community: community ? communitySummary(community.slug) : null,
    related,
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
  const now = new Date().toISOString()
  const draft: RawDraft = { id: mockId(8, created), ...values, createdAt: now, updatedAt: now }
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
  const draft: RawDraft = {
    id: draftId,
    ...values,
    createdAt: DRAFTS[index]!.createdAt,
    updatedAt: new Date().toISOString(),
  }
  // The newest first: an updated draft goes to the top.
  DRAFTS.splice(index, 1)
  DRAFTS.unshift(draft)
  return { status: 200, body: draft }
}

/** The user's draft by its id, if there is one (publishing it with POST /posts, P-022). */
export function draftOf(draftId: string, userId: string): RawDraft | undefined {
  return userId === DEMO_USER.id ? DRAFTS.find((each) => each.id === draftId) : undefined
}

/** DELETE /drafts/{draftId}?userId= */
export function deleteDraft(draftId: string, userId: string | undefined): MockResponse {
  if (userId !== DEMO_USER.id) return error(403, 'USER_MISMATCH')
  const index = DRAFTS.findIndex((each) => each.id === draftId)
  if (index === -1) return error(404, 'NOT_FOUND')
  DRAFTS.splice(index, 1)
  return { status: 204 }
}
