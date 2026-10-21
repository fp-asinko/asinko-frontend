import 'server-only'
import { cache } from 'react'
import { apiRequest, invalidInput, type ApiResult } from '@/lib/api'
import { profileSchema, userSchema, type RawProfile } from '@/lib/api/contract'
import { communitySlugSchema } from '@/lib/communities/community-slug.schema'
import { allowedImageUrl } from '@/lib/images'
import { toProfileLink, type ProfileLink } from '@/lib/profile-links'
import { getViewer } from '@/lib/session'
import type { ProfileDetails } from '../communities.types'
import { knownOpenTo } from '../open-to.constants'
import type { EditProfileChanges } from '../schemas/edit-profile.schema'

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
    headline: profile.headline?.trim() || null,
    city: profile.city?.trim() || null,
    countryCode: profile.countryCode,
    // Only http(s) and five at most, whatever arrives (security.md § 1).
    links: (profile.links ?? [])
      .map(toProfileLink)
      .filter((link): link is ProfileLink => link !== null)
      .slice(0, 5),
    openTo: knownOpenTo(profile.openTo),
    bannerUrl: allowedImageUrl(profile.bannerUrl ?? null),
    followerCount: profile.followerCount,
    followingCount: profile.followingCount,
    accuracyRate: profile.accuracyRate,
    points: profile.points,
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
 * throws: NOT_FOUND passes through for the not-found page. Cached per request: the page and its
 * right column ask for the same one (specs/profile-aside).
 */
export const getProfileDetails = cache(async function getProfileDetails(
  username: string,
): Promise<ApiResult<ProfileDetails>> {
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
})

/**
 * What the backend lacks, sent apart: "open to" (P-026). The headline, city, links, banner and the
 * About of 2000 are the backend's since 2026-10-20 (specs/backend-answer-1020).
 */
const PROPOSED: readonly string[] = ['openTo']

const isProposed = (key: string) => PROPOSED.includes(key)

/**
 * Edits the viewer's own profile (E01, specs/profile-edit, specs/profile-presentation PP-08): only
 * what changed. The userId always comes from the server session (api-integration.md). The proposed
 * fields go in a request of their own, so they reach the mock while the backend lacks them and the
 * rest still reaches the backend; once P-026 exists, it is one request. An empty country
 * removes it (null), as an empty text does ("").
 */
export async function updateProfileAs(
  userId: string,
  changes: EditProfileChanges,
): Promise<ApiResult<null>> {
  const { countryCode, ...rest } = changes
  const body: Record<string, unknown> = {
    ...rest,
    ...(countryCode !== undefined && { countryCode: countryCode || null }),
  }
  const proposed = Object.fromEntries(Object.entries(body).filter(([key]) => isProposed(key)))
  const known = Object.fromEntries(Object.entries(body).filter(([key]) => !(key in proposed)))

  for (const part of [known, proposed]) {
    if (Object.keys(part).length === 0) continue
    const result = await apiRequest({
      method: 'PATCH',
      path: '/api/v1/users/:userId',
      params: { userId },
      body: part,
      schema: userSchema,
    })
    if (!result.ok) return result
  }
  return { ok: true, data: null }
}
