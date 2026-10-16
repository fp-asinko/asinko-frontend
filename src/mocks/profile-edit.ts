import type { RawProfile } from '@/lib/api/contract'
import { DEMO_USER } from './demo-user'
import { PROFILES } from './fixtures/users'
import type { MockResponse } from './types'

// Editing your own profile (E01, specs/profile-edit and specs/profile-presentation), for the demo
// viewer. Validates as the backend does (and as P-019 and P-020 propose); what is saved lives in
// this process's memory, so an e2e can save it and see it.

const BIO_MAX = 160
const DISPLAY_NAME_MAX = 50
const HEADLINE_MAX = 100
const CITY_MAX = 60
const LINKS_MAX = 5

/** The fields of P-019 and P-020: a PATCH with any of them goes to the mock (`when`). */
export const PROPOSED_USER_FIELDS = ['headline', 'city', 'links', 'bannerUrl'] as const

const isHttpUrl = (value: unknown) => {
  if (typeof value !== 'string') return false
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol)
  } catch {
    return false
  }
}
const isText = (value: unknown) =>
  value === undefined || value === null || typeof value === 'string'
const tooLong = (value: unknown, max: number) => typeof value === 'string' && value.length > max
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
  const texts = ['displayName', 'avatarUrl', 'countryCode', 'headline', 'city', 'bannerUrl']
  if (!texts.every((field) => isText(input[field]))) return error(422, 'VALIDATION_ERROR')
  if (tooLong(input.bio, BIO_MAX)) return error(422, 'BIO_TOO_LONG')
  if (tooLong(input.displayName, DISPLAY_NAME_MAX)) return error(422, 'DISPLAY_NAME_TOO_LONG')
  if (tooLong(input.headline, HEADLINE_MAX)) return error(422, 'HEADLINE_TOO_LONG')
  if (tooLong(input.city, CITY_MAX)) return error(422, 'CITY_TOO_LONG')
  if (typeof input.countryCode === 'string' && !/^[A-Z]{2}$/.test(input.countryCode)) {
    return error(422, 'VALIDATION_ERROR')
  }
  if (input.links !== undefined) {
    if (!Array.isArray(input.links)) return error(422, 'VALIDATION_ERROR')
    if (input.links.length > LINKS_MAX) return error(422, 'TOO_MANY_LINKS')
    if (!input.links.every(isHttpUrl)) return error(422, 'INVALID_LINK')
  }
  const profile = PROFILES.find((each) => each.id === userId) as RawProfile
  // "" or null removes it, as the backend does with displayName.
  const text = (value: unknown) => (typeof value === 'string' && value.trim() ? value : null)
  if (typeof input.bio === 'string') profile.bio = input.bio || null
  if ('displayName' in input) profile.displayName = text(input.displayName)
  if ('avatarUrl' in input) profile.avatarUrl = text(input.avatarUrl)
  if ('countryCode' in input) {
    profile.countryCode = text(input.countryCode)
    profile.countrySource = profile.countryCode ? 'MANUAL' : null
  }
  if ('headline' in input) profile.headline = text(input.headline)
  if ('city' in input) profile.city = text(input.city)
  if ('bannerUrl' in input) profile.bannerUrl = text(input.bannerUrl)
  if (Array.isArray(input.links)) profile.links = input.links as string[]
  // The response is the User, not the extended Profile (E01).
  const { id, username, usernameChangedAt, avatarUrl, bio, countryCode, countrySource } = profile
  const { language, isPublic, status, createdAt, headline, city, links } = profile
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
      headline,
      city,
      links,
    },
  }
}
