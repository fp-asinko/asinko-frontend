import type { RawCommunity } from '@/lib/api/contract'
import { COMMUNITIES, communityBySlug } from './fixtures/communities'
import type { MockResponse } from './types'

// Create a group and change its images (E02, specs/community-create): as the backend, in this
// process's memory. The new group joins COMMUNITIES, so its page, "mine" and the moderators' checks
// (its images, its widgets) find it, until the server restarts.

/** The backend's rule (asinko-app SLUG_RE): lower case, digits and hyphens, 1 to 50. */
const SLUG = /^[a-z0-9-]{1,50}$/

const error = (status: number, code: string): MockResponse => ({
  status,
  body: { error: { code, message: 'mock' } },
})

const optional = (value: unknown) => (typeof value === 'string' ? value : null)

/** POST /communities { userId, slug, name, description?, rules?, mainUrl?, avatarUrl?, bannerUrl? } */
export function createCommunity(body: unknown, caller: string): MockResponse {
  const input = (body ?? {}) as Record<string, unknown>
  if (input.userId !== caller) return error(403, 'USER_MISMATCH')
  if (typeof input.slug !== 'string' || !input.slug) return error(400, 'BAD_REQUEST')
  if (typeof input.name !== 'string' || !input.name) return error(400, 'BAD_REQUEST')
  if (!SLUG.test(input.slug)) return error(422, 'INVALID_SLUG')
  // Taken, as the backend's: any community with that slug (the asset ones are upper case).
  if (communityBySlug(input.slug)) return error(409, 'SLUG_TAKEN')

  const created: RawCommunity = {
    id: crypto.randomUUID(),
    slug: input.slug,
    slugChangedAt: null,
    name: input.name,
    description: optional(input.description),
    avatarUrl: optional(input.avatarUrl),
    bannerUrl: optional(input.bannerUrl),
    type: 'USER_PUBLIC',
    assetId: null,
    mainUrl: optional(input.mainUrl),
    rules: optional(input.rules),
    memberCount: 1,
    createdByProfileId: caller,
    createdAt: new Date().toISOString(),
    // Who creates it is its principal moderator and first member.
    viewerMembership: 'PRINCIPAL_MODERATOR',
    viewerIsFavorite: false,
    tags: [],
  }
  COMMUNITIES.push(created)
  return { status: 201, body: created }
}

/**
 * What a moderator edits (E02) and its length (P-048); null removes it. The name is required:
 * never null nor empty. The slug is left out (specs/community-edit Q2): ignored.
 */
const EDITABLE = {
  name: 50,
  description: 500,
  rules: 2000,
  mainUrl: 300,
  avatarUrl: Infinity,
  bannerUrl: Infinity,
} as const

const fieldError = (field: string): MockResponse => ({
  status: 422,
  body: { error: { code: 'VALIDATION_ERROR', message: 'mock', field } },
})

/** PATCH /communities/{slug} { userId, name?, description?, rules?, mainUrl?, avatarUrl?, bannerUrl? } */
export function updateCommunity(slug: string, body: unknown, caller: string): MockResponse {
  const community = communityBySlug(slug)
  if (!community) return error(404, 'NOT_FOUND')
  const input = (body ?? {}) as Record<string, unknown>
  if (input.userId !== caller) return error(403, 'USER_MISMATCH')
  const role = community.viewerMembership
  if (role !== 'MODERATOR' && role !== 'PRINCIPAL_MODERATOR') return error(403, 'NOT_MODERATOR')
  // Checked whole before anything changes: a refusal leaves the group as it was.
  const keys = (Object.keys(EDITABLE) as (keyof typeof EDITABLE)[]).filter((key) => key in input)
  for (const key of keys) {
    const value = input[key]
    if (key === 'name' && (typeof value !== 'string' || !value.trim())) return fieldError(key)
    if (value !== null && typeof value !== 'string') return fieldError(key)
    if (typeof value === 'string' && value.length > EDITABLE[key]) return fieldError(key)
  }
  for (const key of keys) {
    const value = input[key] as string | null
    if (key === 'name') community.name = value as string
    else community[key] = value
  }
  return { status: 200, body: community }
}
