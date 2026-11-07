import 'server-only'
import { apiRequest, paginatedSchema, type ApiResult } from '@/lib/api'
import { communitySchema } from '@/lib/api/contract'
import { mentionOf } from '@/lib/communities/paths'

/** A community that already exists, as the form shows it: its handle, name, size and page. */
export type SimilarGroup = { handle: string; name: string; memberCount: number; path: string }

/** Shown at most: a hint, not a list to browse. */
const SIMILAR_MAX = 3

/**
 * Groups whose name looks like the one being created (specs/community-create CG-22), so a
 * duplicate is noticed before it is made: the first page of GET /communities?search=, groups and
 * assets alike ($BTC is a duplicate of a Bitcoin group), never a personal channel.
 */
export async function searchSimilarGroups(name: string): Promise<ApiResult<SimilarGroup[]>> {
  const result = await apiRequest({
    method: 'GET',
    path: '/api/v1/communities',
    query: { search: name },
    schema: paginatedSchema(communitySchema),
  })
  if (!result.ok) return result
  return {
    ok: true,
    data: result.data.items
      .filter((community) => community.type !== 'PERSONAL_CHANNEL')
      .slice(0, SIMILAR_MAX)
      .map((community) => ({
        ...mentionOf(community),
        name: community.name,
        memberCount: community.memberCount,
      })),
  }
}
