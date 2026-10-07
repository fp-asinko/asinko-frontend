import 'server-only'
import { apiRequest, noContentSchema, type ApiResult } from '@/lib/api'
import { favoriteResponseSchema, joinResponseSchema } from '@/lib/api/contract'

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

/** Leaves a community (E02, idempotent 204). A principal moderator cannot (403). */
export async function leaveCommunityAs(userId: string, slug: string): Promise<ApiResult<null>> {
  const result = await apiRequest({
    method: 'DELETE',
    path: '/api/v1/communities/:slug/members/:userId',
    params: { slug, userId },
    query: { userId },
    schema: noContentSchema,
  })
  return result.ok ? { ok: true, data: null } : result
}

/** Marks or unmarks a favorite (E02). Marking needs membership (404 NOT_MEMBER). */
export async function setFavoriteAs(
  userId: string,
  slug: string,
  favorite: boolean,
): Promise<ApiResult<{ favorite: boolean }>> {
  const result = favorite
    ? await apiRequest({
        method: 'PUT',
        path: '/api/v1/communities/:slug/favorite',
        params: { slug },
        body: { userId },
        schema: favoriteResponseSchema,
      })
    : await apiRequest({
        method: 'DELETE',
        path: '/api/v1/communities/:slug/favorite',
        params: { slug },
        query: { userId },
        schema: noContentSchema,
      })
  return result.ok ? { ok: true, data: { favorite } } : result
}
