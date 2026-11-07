import 'server-only'
import { apiRequest, type ApiResult } from '@/lib/api'
import { communitySchema } from '@/lib/api/contract'
import type { CreateGroupInput } from '../schemas/create-group.schema'

/** The new group, as the form needs it: its id for the images and its slug for its page. */
export type CreatedGroup = { id: string; slug: string }

/**
 * Creates a public group (specs/community-create CG-09, POST /communities): the creator becomes its
 * principal moderator and first member. The userId always comes from the server session
 * (api-integration.md § userId explícito).
 */
export async function createGroupAs(
  userId: string,
  input: CreateGroupInput,
): Promise<ApiResult<CreatedGroup>> {
  const result = await apiRequest({
    method: 'POST',
    path: '/api/v1/communities',
    body: { userId, ...input },
    schema: communitySchema,
  })
  return result.ok ? { ok: true, data: { id: result.data.id, slug: result.data.slug } } : result
}
