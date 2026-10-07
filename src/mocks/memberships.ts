import { DEMO_USER } from './demo-user'
import { communityBySlug } from './fixtures/communities'
import type { MockResponse } from './types'

// Join, leave and favorite of the contract (E02) for the demo viewer. Stateless, like the votes: a
// reload shows the fixtures again (specs/community-first § 3.3, specs/community-pages).

const error = (status: number, code: string): MockResponse => ({
  status,
  body: { error: { code, message: 'mock' } },
})

export function joinCommunity(slug: string, targetUserId: string, body: unknown): MockResponse {
  const community = communityBySlug(slug)
  if (!community) return error(404, 'NOT_FOUND')
  const { userId } = (body ?? {}) as { userId?: unknown }
  if (userId !== DEMO_USER.id) return error(403, 'USER_MISMATCH')
  if (targetUserId !== userId) return error(403, 'FORBIDDEN')
  const memberCount = community.memberCount + (community.viewerMembership ? 0 : 1)
  return { status: 200, body: { viewerMembership: 'MEMBER', memberCount } }
}

/** DELETE …/members/{targetUserId}?userId=: idempotent 204; a principal moderator cannot leave. */
export function leaveCommunity(
  slug: string,
  targetUserId: string,
  userId: string | undefined,
): MockResponse {
  const community = communityBySlug(slug)
  if (!community) return error(404, 'NOT_FOUND')
  if (userId !== DEMO_USER.id) return error(403, 'USER_MISMATCH')
  if (targetUserId !== userId) return error(403, 'FORBIDDEN')
  if (community.viewerMembership === 'PRINCIPAL_MODERATOR') {
    return error(403, 'CANNOT_LEAVE_AS_PRINCIPAL_MODERATOR')
  }
  return { status: 204 }
}

/** PUT …/favorite: only for members (404 NOT_MEMBER). */
export function addFavorite(slug: string, body: unknown): MockResponse {
  const community = communityBySlug(slug)
  if (!community) return error(404, 'NOT_FOUND')
  const { userId } = (body ?? {}) as { userId?: unknown }
  if (userId !== DEMO_USER.id) return error(403, 'USER_MISMATCH')
  if (!community.viewerMembership) return error(404, 'NOT_MEMBER')
  return { status: 200, body: { viewerIsFavorite: true } }
}

/** DELETE …/favorite?userId=: idempotent 204. */
export function removeFavorite(slug: string, userId: string | undefined): MockResponse {
  if (!communityBySlug(slug)) return error(404, 'NOT_FOUND')
  if (userId !== DEMO_USER.id) return error(403, 'USER_MISMATCH')
  return { status: 204 }
}
