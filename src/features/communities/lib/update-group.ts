import 'server-only'
import { apiRequest, type ApiResult } from '@/lib/api'
import { communitySchema } from '@/lib/api/contract'
import type { EditGroupChanges } from '../schemas/create-group.schema'

/**
 * Saves what changed in a group (specs/community-edit CE-03, PATCH /communities/{slug}, for its
 * moderators). The userId always comes from the server session (api-integration.md).
 */
export async function updateGroupAs(
  userId: string,
  slug: string,
  changes: EditGroupChanges,
): Promise<ApiResult<null>> {
  const result = await apiRequest({
    method: 'PATCH',
    path: '/api/v1/communities/:slug',
    params: { slug },
    body: { userId, ...changes },
    schema: communitySchema,
  })
  return result.ok ? { ok: true, data: null } : result
}
