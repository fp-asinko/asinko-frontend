import 'server-only'
import { apiRequest } from '@/lib/api'
import { profileSchema, userSchema } from '@/lib/api/contract'

/** Why a profile could not be created, as the forms say it (AU-08). */
export type ProfileFailure = 'usernameTaken' | 'usernameInvalid' | 'termsRequired' | 'unavailable'

const FAILURE_BY_CODE: Record<string, ProfileFailure> = {
  USERNAME_TAKEN: 'usernameTaken',
  INVALID_USERNAME: 'usernameInvalid',
  TERMS_NOT_ACCEPTED: 'termsRequired',
}

/**
 * Creates the profile of the account that is signing up (E01, POST /users): the backend takes the
 * user from the Bearer, and also creates the personal channel. Age and terms go as accepted: the
 * form does not send without them (AU-05).
 */
export async function createProfile(
  username: string,
  language: string,
  accessToken?: string,
): Promise<{ ok: true; username: string } | { ok: false; reason: ProfileFailure }> {
  const result = await apiRequest({
    method: 'POST',
    path: '/api/v1/users',
    schema: userSchema.pick({ username: true }),
    body: { username, ageConfirmed: true, termsAccepted: true, language },
    accessToken,
  })
  if (result.ok) return { ok: true, username: result.data.username }
  const reason = result.kind === 'expected' ? FAILURE_BY_CODE[result.code] : undefined
  return { ok: false, reason: reason ?? 'unavailable' }
}

/**
 * Whether a username is already someone's, before creating an account (AU-08): the backend has no
 * endpoint for it, but a public profile answers by its username. A private one answers 404 as a
 * free one: POST /users still refuses it, and the person chooses again (AU-09). If the backend does
 * not answer, it is not known.
 */
export async function isUsernameTaken(username: string): Promise<boolean | null> {
  const result = await apiRequest({
    method: 'GET',
    path: '/api/v1/profiles/:identifier',
    params: { identifier: username },
    schema: profileSchema.pick({ username: true }),
  })
  if (result.ok) return true
  return result.status === 404 ? false : null
}
