import 'server-only'
import { z } from 'zod'
import { apiRequest, invalidInput, keepValidItems, type ApiResult } from '@/lib/api'
import { communityMemberSchema, type RawCommunityMember } from '@/lib/api/contract'
import { communitySlugSchema } from '@/lib/communities/community-slug.schema'
import { communityPath } from '@/lib/communities/paths'
import { allowedImageUrl } from '@/lib/images'
import type { FollowItem } from '../communities.types'

const PATH = '/api/v1/communities/:slug/members'
const ENDPOINT = `GET ${PATH}`
const looseListSchema = z.object({ items: z.array(z.unknown()), nextCursor: z.string().nullable() })
const cursorSchema = z.string().regex(/^[A-Za-z0-9_\-=.:]{1,512}$/)

/** A member as a row of the people lists: no accuracy (not sent), no role (Q3). */
export function toMemberItem(member: RawCommunityMember, viewerName: string | null): FollowItem {
  return {
    username: member.username,
    displayName: member.displayName?.trim() || null,
    path: communityPath('user', member.username),
    avatarUrl: allowedImageUrl(member.avatarUrl),
    accuracyRate: null,
    // P-017 (backend 2026-10-20): null without a session, whatever the response says (as the
    // community pages, CF-12), and then Follow asks for an account.
    followed: viewerName ? (member.isFollowedByViewer ?? null) : null,
    isSelf: viewerName === member.username,
  }
}

/**
 * A page of a community's members, newest first (E02, specs/community-members CM-03). The slug
 * and the cursor are checked before the network; a broken item does not take the list down.
 */
export async function getMembers(
  slug: string,
  viewerName: string | null,
  cursor?: string,
): Promise<ApiResult<{ items: FollowItem[]; nextCursor: string | null }>> {
  if (!communitySlugSchema.safeParse(slug).success) return invalidInput(ENDPOINT)
  if (cursor !== undefined && !cursorSchema.safeParse(cursor).success) return invalidInput(ENDPOINT)
  const result = await apiRequest({
    method: 'GET',
    path: PATH,
    params: { slug },
    query: cursor ? { cursor } : undefined,
    schema: looseListSchema,
  })
  if (!result.ok) return result
  return {
    ok: true,
    data: {
      items: keepValidItems(result.data.items, communityMemberSchema, ENDPOINT).map((member) =>
        toMemberItem(member, viewerName),
      ),
      nextCursor: result.data.nextCursor,
    },
  }
}
