import 'server-only'
import { cache } from 'react'
import { z } from 'zod'
import { apiRequest, keepValidItems } from '@/lib/api'
import {
  activeCommunitiesSchema,
  activeCommunitySchema,
  type RawActiveCommunity,
} from '@/lib/api/contract'
import { communityPath, kindOf } from '@/lib/communities/paths'
import { allowedImageUrl } from '@/lib/images'
import type { ActiveCommunity } from '../communities.types'

const ENDPOINT = 'GET /api/v1/users/:userId/active-communities'

/** "Participate in" shows five and folds the rest, up to twenty (specs/profile-aside PA-05). */
export const ACTIVE_LIMIT = 20

/** The last 90 days (Q2): what the person talks about now. */
const DAYS = 90

export function toActiveCommunity({ community, postCount }: RawActiveCommunity): ActiveCommunity {
  const kind = kindOf(community.type)
  const handle =
    kind === 'asset'
      ? `$${community.slug.toUpperCase()}`
      : kind === 'user'
        ? `@${community.slug}`
        : `#${community.slug}`
  return {
    handle,
    path: communityPath(kind, community.slug),
    avatarUrl: allowedImageUrl(community.avatarUrl),
    colorKey: community.slug,
    kind,
    postCount,
  }
}

/**
 * Where a person published in the last 90 days, the most posts first (P-027, PA-05). A secondary
 * part of the profile: nothing if it cannot be asked. Cached per request: the page (phones) and its
 * right column (desktop) show the same card.
 */
export const getActiveCommunities = cache(async function getActiveCommunities(
  userId: string,
): Promise<ActiveCommunity[]> {
  if (!z.uuid().safeParse(userId).success) return []
  const result = await apiRequest({
    method: 'GET',
    path: '/api/v1/users/:userId/active-communities',
    params: { userId },
    query: { days: String(DAYS), limit: String(ACTIVE_LIMIT) },
    schema: activeCommunitiesSchema,
  })
  if (!result.ok) return []
  return keepValidItems(result.data.items, activeCommunitySchema, ENDPOINT).map(toActiveCommunity)
})
