import type { RawProfile } from '@/lib/api/contract'
import { DEMO_USER } from './demo-user'
import { PROFILES } from './fixtures/users'
import type { MockResponse } from './types'

// Editing your own profile (E01, specs/profile-edit), for the demo viewer. Validates as the
// backend does; the new bio lives in this process's memory, so an e2e can save it and see it.

const BIO_MAX = 160
const error = (status: number, code: string): MockResponse => ({
  status,
  body: { error: { code, message: 'mock' } },
})

export function updateUser(userId: string, body: unknown): MockResponse {
  const input = (body ?? {}) as Record<string, unknown>
  // The backend compares the path's userId with the session's (self only).
  if (userId !== DEMO_USER.id) return error(403, 'USER_MISMATCH')
  if (input.bio !== undefined && typeof input.bio !== 'string') {
    return error(422, 'VALIDATION_ERROR')
  }
  if (typeof input.bio === 'string' && input.bio.length > BIO_MAX) {
    return error(422, 'BIO_TOO_LONG')
  }
  const profile = PROFILES.find((each) => each.id === userId) as RawProfile
  if (typeof input.bio === 'string') profile.bio = input.bio || null
  // The response is the User, not the extended Profile (E01).
  const { id, username, usernameChangedAt, avatarUrl, bio, countryCode, countrySource } = profile
  const { language, isPublic, status, createdAt } = profile
  return {
    status: 200,
    body: {
      id,
      username,
      usernameChangedAt,
      avatarUrl,
      bio,
      countryCode,
      countrySource,
      language,
      isPublic,
      status,
      createdAt,
    },
  }
}
