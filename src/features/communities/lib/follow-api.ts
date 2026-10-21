import 'server-only'
import { z } from 'zod'
import { apiRequest, invalidInput, keepValidItems, type ApiResult } from '@/lib/api'
import { userSummarySchema, type RawUserSummary } from '@/lib/api/contract'
import { communityPath } from '@/lib/communities/paths'
import { allowedImageUrl } from '@/lib/images'
import type { FollowItem, FollowKind } from '../communities.types'

const looseListSchema = z.object({ items: z.array(z.unknown()), nextCursor: z.string().nullable() })
const cursorSchema = z.string().regex(/^[A-Za-z0-9_\-=.:]{1,512}$/)

const PATHS = {
  followers: '/api/v1/users/:userId/followers',
  following: '/api/v1/users/:userId/following',
} as const

export function toFollowItem(user: RawUserSummary, viewerName: string | null): FollowItem {
  return {
    username: user.username,
    displayName: user.displayName?.trim() || null,
    path: communityPath('user', user.username),
    avatarUrl: allowedImageUrl(user.avatarUrl),
    accuracyRate: user.accuracyRate ?? null,
    // P-017 (backend 2026-10-20): null without a session, whatever the response says (as the
    // community pages, CF-12), and then Follow asks for an account.
    followed: viewerName ? (user.isFollowedByViewer ?? null) : null,
    isSelf: viewerName === user.username,
  }
}

/**
 * A page of a person's followers or of whom they follow (E01, specs/follow-lists FL-03). The id
 * and the cursor are checked before the network; a broken item does not take the list down.
 */
export async function getFollowList(
  userId: string,
  kind: FollowKind,
  viewerName: string | null,
  cursor?: string,
): Promise<ApiResult<{ items: FollowItem[]; nextCursor: string | null }>> {
  const endpoint = `GET ${PATHS[kind]}`
  if (!z.uuid().safeParse(userId).success) return invalidInput(endpoint)
  if (cursor !== undefined && !cursorSchema.safeParse(cursor).success) return invalidInput(endpoint)
  const result = await apiRequest({
    method: 'GET',
    path: PATHS[kind],
    params: { userId },
    query: cursor ? { cursor } : undefined,
    schema: looseListSchema,
  })
  if (!result.ok) return result
  return {
    ok: true,
    data: {
      items: keepValidItems(result.data.items, userSummarySchema, endpoint).map((user) =>
        toFollowItem(user, viewerName),
      ),
      nextCursor: result.data.nextCursor,
    },
  }
}
