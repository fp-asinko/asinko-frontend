import { DEMO_USER } from './demo-user'
import { communityBySlug } from './fixtures/communities'
import type { MockResponse } from './types'

// Join of the contract (E02) for the demo viewer. Stateless, like the votes: a reload shows the
// fixtures again (specs/community-first § 3.3).

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
