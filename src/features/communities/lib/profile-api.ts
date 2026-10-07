import 'server-only'
import { apiRequest, invalidInput, type ApiResult } from '@/lib/api'
import { profileSchema, type RawProfile } from '@/lib/api/contract'
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
const TIERS = { CREATOR: 'creator', PARTNER: 'partner' } as const

export function toProfileDetails(profile: RawProfile, viewerName: string | null): ProfileDetails {
  return {
    username: profile.username,
    displayName: profile.displayName?.trim() || null,
    tier: profile.tier ? TIERS[profile.tier] : null,
    rating: profile.rating ?? null,
    badge: BADGES[profile.badgeStatus],
    bio: profile.bio?.trim() || null,
    avatarUrl: allowedImageUrl(profile.avatarUrl),
    followerCount: profile.followerCount,
    accuracyRate: profile.accuracyRate,
    currentStreak: profile.currentStreak,
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
