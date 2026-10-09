import 'server-only'
import { apiRequest, invalidInput, type ApiResult } from '@/lib/api'
import { profileSchema, userSchema, type RawProfile } from '@/lib/api/contract'
import { communitySlugSchema } from '@/lib/communities/community-slug.schema'
import { allowedImageUrl } from '@/lib/images'
import { getViewer } from '@/lib/session'
import type { ProfileDetails } from '../communities.types'

const ENDPOINT = 'GET /api/v1/profiles/:identifier'

const BADGES = {
  NONE: null,
  IDENTITY_VERIFIED: 'verified',
  INSTITUTIONAL: 'institutional',
} as const

export function toProfileDetails(profile: RawProfile, viewerName: string | null): ProfileDetails {
  return {
    id: profile.id,
    username: profile.username,
    displayName: profile.displayName?.trim() || null,
    badge: BADGES[profile.badgeStatus],
    bio: profile.bio?.trim() || null,
    avatarUrl: allowedImageUrl(profile.avatarUrl),
    followerCount: profile.followerCount,
    followingCount: profile.followingCount,
    accuracyRate: profile.accuracyRate,
    correctCount: profile.correctCount,
    incorrectCount: profile.incorrectCount,
    cancelledCount: profile.cancelledCount,
    currentStreak: profile.currentStreak,
    joinedAt: profile.createdAt,
    isSelf: viewerName === profile.username,
  }
}

/**
 * The profile of a /user page (specs/community-pages § 12), next to its personal channel. Never
 * throws: NOT_FOUND passes through for the not-found page.
 */
export async function getProfileDetails(username: string): Promise<ApiResult<ProfileDetails>> {
  if (!communitySlugSchema.safeParse(username).success) return invalidInput(ENDPOINT)
  const [result, viewer] = await Promise.all([
    apiRequest({
      method: 'GET',
      path: '/api/v1/profiles/:identifier',
      params: { identifier: username },
      schema: profileSchema,
    }),
    getViewer(),
  ])
  return result.ok
    ? { ok: true, data: toProfileDetails(result.data, viewer?.username ?? null) }
    : result
}

/**
 * Edits the viewer's own profile (E01, specs/profile-edit). The userId always comes from the
 * server session (api-integration.md). Answers the bio as saved, or null when it was removed.
 */
export async function updateProfileAs(
  userId: string,
  input: { bio: string },
): Promise<ApiResult<{ bio: string | null }>> {
  const result = await apiRequest({
    method: 'PATCH',
    path: '/api/v1/users/:userId',
    params: { userId },
    body: { bio: input.bio },
    schema: userSchema,
  })
  return result.ok ? { ok: true, data: { bio: result.data.bio?.trim() || null } } : result
}
