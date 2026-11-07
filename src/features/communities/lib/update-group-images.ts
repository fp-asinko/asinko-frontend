import 'server-only'
import { apiRequest, type ApiResult } from '@/lib/api'
import { communitySchema } from '@/lib/api/contract'

/** Which of a group's images: its photo or its banner. */
export type GroupImageKind = 'avatar' | 'banner'

const FIELD = { avatar: 'avatarUrl', banner: 'bannerUrl' } as const

/**
 * Saves an uploaded image as a group's photo or banner (specs/community-create CG-11, PATCH
 * /communities/{slug}, for its moderators). Answers the URL the group keeps, the response's: the
 * backend re-encodes the image and it is not the one uploaded.
 */
export async function updateGroupImageAs(
  userId: string,
  slug: string,
  kind: GroupImageKind,
  imageUrl: string,
): Promise<ApiResult<{ imageUrl: string | null }>> {
  const result = await apiRequest({
    method: 'PATCH',
    path: '/api/v1/communities/:slug',
    params: { slug },
    body: { userId, [FIELD[kind]]: imageUrl },
    schema: communitySchema,
  })
  return result.ok ? { ok: true, data: { imageUrl: result.data[FIELD[kind]] } } : result
}
