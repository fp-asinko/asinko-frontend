import 'server-only'
import { apiRequest } from '@/lib/api'
import { userSchema, usernameAvailabilitySchema } from '@/lib/api/contract'

/** Why a profile could not be created, as the forms say it (AU-08). */
export type ProfileFailure =
  'usernameTaken' | 'usernameInvalid' | 'displayNameTooLong' | 'termsRequired' | 'unavailable'

const FAILURE_BY_CODE: Record<string, ProfileFailure> = {
  USERNAME_TAKEN: 'usernameTaken',
  INVALID_USERNAME: 'usernameInvalid',
  TERMS_NOT_ACCEPTED: 'termsRequired',
  DISPLAY_NAME_TOO_LONG: 'displayNameTooLong',
}

/**
 * Creates the profile of the account that is signing up (E01, POST /users): the backend takes the
 * user from the Bearer, and also creates the personal channel. Age and terms go as accepted: the
 * form does not send without them (AU-05).
 */
export async function createProfile(
  username: string,
  language: string,
  displayName?: string,
  accessToken?: string,
): Promise<{ ok: true; username: string } | { ok: false; reason: ProfileFailure }> {
  const result = await apiRequest({
    method: 'POST',
    path: '/api/v1/users',
    schema: userSchema.pick({ username: true }),
    body: {
      username,
      ageConfirmed: true,
      termsAccepted: true,
      language,
      // A field of User that POST /users also takes (E01); empty, it is not sent.
      ...(displayName ? { displayName } : {}),
    },
    accessToken,
  })
  if (result.ok) return { ok: true, username: result.data.username }
  const reason = result.kind === 'expected' ? FAILURE_BY_CODE[result.code] : undefined
  return { ok: false, reason: reason ?? 'unavailable' }
}

/**
 * Saves the photo just uploaded in the new profile (AU-21): E01, PATCH /users/{id}. The URL it
 * keeps (the backend re-encodes the image, P-021), or null when it failed.
 */
export async function saveAvatar(userId: string, avatarUrl: string): Promise<string | null> {
  const result = await apiRequest({
    method: 'PATCH',
    path: '/api/v1/users/:userId',
    params: { userId },
    schema: userSchema.pick({ avatarUrl: true }),
    body: { avatarUrl },
  })
  return result.ok ? result.data.avatarUrl : null
}

/** Whether a username can be chosen, as far as the backend says (AU-24). */
export type UsernameAvailability = 'available' | 'taken' | 'unknown'

/**
 * Asks whether a username is free while the welcome step is typed (P-035, proposal): only a hint,
 * POST /users decides. Anything but a clear answer is 'unknown', and the form says nothing.
 */
export async function usernameAvailability(username: string): Promise<UsernameAvailability> {
  const result = await apiRequest({
    method: 'GET',
    path: '/api/v1/usernames/:username',
    params: { username },
    schema: usernameAvailabilitySchema,
  })
  if (!result.ok) return 'unknown'
  return result.data.available ? 'available' : 'taken'
}
