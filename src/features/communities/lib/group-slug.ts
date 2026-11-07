import 'server-only'
import { apiRequest } from '@/lib/api'
import { communitySchema } from '@/lib/api/contract'

export type SlugAvailability = 'free' | 'taken' | 'unknown'

/**
 * Whether a handle is free for a new group (specs/community-create CG-06): the backend has no
 * question for it, so it asks for the group by that slug. A 404 is free, a group is taken; any
 * other failure is not known (the client already reported it) and shows nothing.
 */
export async function groupSlugAvailability(slug: string): Promise<SlugAvailability> {
  const result = await apiRequest({
    method: 'GET',
    path: '/api/v1/communities/:slug',
    params: { slug },
    schema: communitySchema,
  })
  if (result.ok) return 'taken'
  return result.code === 'NOT_FOUND' ? 'free' : 'unknown'
}
