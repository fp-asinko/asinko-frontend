import type { RawProfile } from '@/lib/api/contract'
import { mockTokenUser } from './auth'
import { addPersonalChannel } from './fixtures/communities'
import { PROFILES } from './fixtures/users'
import type { MockContext, MockResponse } from './types'

/** The backend's rule (asinko-app USERNAME_RE). */
const USERNAME = /^[a-zA-Z0-9_]{3,30}$/

/** Always someone's: the e2e's taken username (specs/auth design.md § 9). */
export const MOCK_TAKEN_USERNAME = 'taken'

const error = (status: number, code: string): MockResponse => ({
  status,
  body: { error: { code, message: code } },
})

/**
 * P-035 (proposal), GET /usernames/{username}: free unless someone has it, in any case, or it is
 * the e2e's taken one; 422 for one the backend would refuse, 401 without a session.
 */
export function checkMockUsername({ params, accessToken }: MockContext): MockResponse {
  if (!accessToken) return error(401, 'UNAUTHENTICATED')
  const username = params.username ?? ''
  if (!USERNAME.test(username)) return error(422, 'INVALID_USERNAME')
  const lower = username.toLowerCase()
  const taken =
    lower === MOCK_TAKEN_USERNAME || PROFILES.some((each) => each.username.toLowerCase() === lower)
  return { status: 200, body: { available: !taken } }
}

/**
 * POST /users (E01) as the backend does it: the user is the Bearer's, a new profile with its
 * personal channel, and its errors. The profile joins the mock world (PROFILES) with its channel,
 * so it has a page.
 */
export function createMockProfile({ body, accessToken }: MockContext): MockResponse {
  const userId = mockTokenUser(accessToken)
  if (!userId) return error(401, 'UNAUTHENTICATED')
  const input = (body ?? {}) as Record<string, unknown>
  const username = typeof input.username === 'string' ? input.username.trim() : ''
  if (!USERNAME.test(username)) return error(422, 'INVALID_USERNAME')
  if (input.ageConfirmed !== true || input.termsAccepted !== true) {
    return error(422, 'TERMS_NOT_ACCEPTED')
  }
  const lower = username.toLowerCase()
  if (
    lower === MOCK_TAKEN_USERNAME ||
    PROFILES.some((each) => each.username.toLowerCase() === lower)
  ) {
    return error(409, 'USERNAME_TAKEN')
  }
  // Already had one: the backend refuses a second (its insert fails on the id).
  if (PROFILES.some((each) => each.id === userId)) return error(409, 'CONFLICT')

  const profile: RawProfile = {
    id: userId,
    username,
    // As the backend (asinko-app createUserProfile): POST /users does not keep it (P-037).
    displayName: null,
    usernameChangedAt: null,
    avatarUrl: null,
    bio: null,
    countryCode: null,
    countrySource: null,
    language: typeof input.language === 'string' ? input.language : null,
    isPublic: true,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    points: 0,
    badgeStatus: 'NONE',
    accuracyRate: null,
    currentStreak: 0,
    correctCount: 0,
    incorrectCount: 0,
    cancelledCount: 0,
    isFollowedByViewer: null,
    followerCount: 0,
    followingCount: 0,
  }
  PROFILES.push(profile)
  // As the backend: its personal channel with it (E01), so the new account has a page.
  addPersonalChannel(profile)
  return { status: 201, body: profile }
}
