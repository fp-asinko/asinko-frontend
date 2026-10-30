import { z } from 'zod'

// The forms of specs/auth (AU-05, AU-06, AU-11). Messages are translation keys (i18n.md); the
// Server Actions validate with the same schemas.

/** The backend's rule (asinko-app USERNAME_RE): 3 to 30 letters, numbers or _. */
export const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,30}$/
/** PO, 2026-10-29 (Q2): 8 or more. 72 is bcrypt's limit, which Supabase uses. */
export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 72
/** The backend's limit for a display name (P-011): 422 DISPLAY_NAME_TOO_LONG past it. */
export const DISPLAY_NAME_MAX = 50

const email = z
  .string()
  .trim()
  .pipe(z.email({ message: 'auth.fields.email.invalid' }))

export const logInSchema = z.object({
  email,
  // Any password: logging in only says whether it is right (AU-04).
  password: z.string().min(1, { message: 'auth.fields.password.required' }),
})

const username = z
  .string()
  .trim()
  .regex(USERNAME_PATTERN, { message: 'auth.fields.username.invalid' })

/** 18 or more, and the Terms and the Privacy (Q1). */
const accepted = z.boolean().refine((value) => value, { message: 'auth.fields.accepted.required' })

/** Only email and password: the username, the photo and the terms come next (design.md § 11). */
export const signUpSchema = z.object({
  email,
  password: z
    .string()
    .min(PASSWORD_MIN, { message: 'auth.fields.password.short' })
    .max(PASSWORD_MAX, { message: 'auth.fields.password.long' }),
})

/** Optional: empty, the profile is titled with the username alone (P-011, design.md § 16). */
const displayName = z
  .string()
  .trim()
  .max(DISPLAY_NAME_MAX, { message: 'auth.fields.displayName.long' })
  .optional()

export const profileSchema = z.object({ username, displayName, accepted })

export type LogInInput = z.infer<typeof logInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
export type ProfileInput = z.infer<typeof profileSchema>
