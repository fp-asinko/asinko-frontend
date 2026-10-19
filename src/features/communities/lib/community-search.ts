import 'server-only'
import { apiRequest, paginatedSchema, type ApiResult } from '@/lib/api'
import { communitySchema } from '@/lib/api/contract'
import { allowedImageUrl } from '@/lib/images'
import type { DraftCommunity } from './widget-drafts'

/**
 * The groups and assets that match a search, for a "Communities" widget (specs/community-widgets
 * CW-10): the first page of GET /communities?search=, without personal channels (a person is not a
 * community to recommend). The search was checked by the action.
 */
export async function searchWidgetCommunities(
  search: string,
): Promise<ApiResult<DraftCommunity[]>> {
  const result = await apiRequest({
    method: 'GET',
    path: '/api/v1/communities',
    query: { search },
    schema: paginatedSchema(communitySchema),
  })
  if (!result.ok) return result
  return {
    ok: true,
    data: result.data.items
      .filter((community) => community.type !== 'PERSONAL_CHANNEL')
      .slice(0, 8)
      .map((community) => ({
        id: community.id,
        slug: community.slug,
        handle:
          community.type === 'SYSTEM_ASSET'
            ? `$${community.slug.toUpperCase()}`
            : `#${community.slug}`,
        avatarUrl: allowedImageUrl(community.avatarUrl),
      })),
  }
}
