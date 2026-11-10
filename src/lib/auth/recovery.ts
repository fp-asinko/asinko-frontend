import { z } from 'zod'
import { safeNext } from './next'

/**
 * The recovery link (specs/password-recovery design.md § 1, § 3). The email's link lands on
 * /auth/reset, which keeps its token in this cookie and sends to the page without it: the token is
 * only spent when the new password is saved, so a mail scanner that opens the link first does not
 * spend it.
 */
export const RECOVERY_COOKIE = 'asinko-recovery'

/** As long as Supabase keeps the link alive (Q4). */
export const RECOVERY_MAX_AGE = 60 * 60

/** Supabase's token hash: letters, digits, `-` and `_`. Anything else is not one of its links. */
const tokenHashSchema = z.string().regex(/^[\w-]{8,200}$/)

/** The token of a link from the email, or null when the link is not one. */
export function recoveryToken(params: URLSearchParams): string | null {
  if (params.get('type') !== 'recovery') return null
  const parsed = tokenHashSchema.safeParse(params.get('token_hash'))
  return parsed.success ? parsed.data : null
}

/** A token kept in the cookie, checked again: the cookie also comes from the browser. */
export function keptRecoveryToken(value: string | undefined): string | null {
  const parsed = tokenHashSchema.safeParse(value)
  return parsed.success ? parsed.data : null
}

/** Where the email's link goes back to (design.md § 4): Supabase adds the token after `next`. */
export function recoveryRedirect(origin: string, next: string): string {
  return `${origin}/auth/reset?next=${encodeURIComponent(safeNext(next))}`
}
