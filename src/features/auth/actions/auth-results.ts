import { z } from 'zod'
import type { AuthFailure } from '@/lib/auth/supabase-auth'
import type { ActionResult } from '@/lib/result'
import type { ProfileFailure } from '../lib/profile-api'

/** A form that did not pass its schema: each field with its key. */
export function invalidForm(error: z.ZodError): ActionResult<never> {
  return {
    ok: false,
    error: 'auth.errors.invalid',
    fieldErrors: z.flattenError(error).fieldErrors as Record<string, string[]>,
  }
}

export const UNAVAILABLE: ActionResult<never> = { ok: false, error: 'auth.errors.unavailable' }

/**
 * Supabase's refusal, said by the forms (AU-04, AU-08): what belongs to a field goes next to it.
 * Never Supabase's message.
 */
export function authFailure(reason: AuthFailure): ActionResult<never> {
  const field = (name: string, key: string): ActionResult<never> => ({
    ok: false,
    error: key,
    fieldErrors: { [name]: [key] },
  })
  switch (reason) {
    case 'emailTaken':
      return field('email', 'auth.errors.emailTaken')
    case 'invalidEmail':
      return field('email', 'auth.fields.email.invalid')
    case 'weakPassword':
      return field('password', 'auth.errors.weakPassword')
    case 'credentials':
      return { ok: false, error: 'auth.errors.credentials' }
    case 'rateLimited':
      return { ok: false, error: 'auth.errors.rateLimited' }
    default:
      return UNAVAILABLE
  }
}

/** The backend's refusal of a username or the terms (AU-08), next to its field. */
export function profileFailure(reason: ProfileFailure): ActionResult<never> {
  switch (reason) {
    case 'usernameTaken':
      return {
        ok: false,
        error: 'auth.errors.usernameTaken',
        fieldErrors: { username: ['auth.errors.usernameTaken'] },
      }
    case 'usernameInvalid':
      return {
        ok: false,
        error: 'auth.fields.username.invalid',
        fieldErrors: { username: ['auth.fields.username.invalid'] },
      }
    case 'termsRequired':
      return {
        ok: false,
        error: 'auth.fields.accepted.required',
        fieldErrors: { accepted: ['auth.fields.accepted.required'] },
      }
    default:
      return UNAVAILABLE
  }
}
