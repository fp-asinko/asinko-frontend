import 'server-only'
import { apiRequest, type ApiResult } from '@/lib/api'
import { joinResponseSchema } from '@/lib/api/contract'

/**
 * Joins a community (E02, idempotent). Shared by the feed and the interests column, which cannot
 * import each other (specs/community-first § 3.1). The userId always comes from the session.
 */
export async function joinCommunityAs(
  userId: string,
  slug: string,
): Promise<ApiResult<{ memberCount: number }>> {
  const result = await apiRequest({
    method: 'PUT',
    path: '/api/v1/communities/:slug/members/:userId',
    params: { slug, userId },
    body: { userId },
    schema: joinResponseSchema,
  })
  return result.ok ? { ok: true, data: { memberCount: result.data.memberCount } } : result
}
