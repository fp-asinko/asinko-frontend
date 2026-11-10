import { NextResponse, type NextRequest } from 'next/server'
import { RECOVERY_COOKIE, RECOVERY_MAX_AGE, recoveryToken } from '@/lib/auth/recovery'
import { secureCookies } from '@/lib/auth/session'
import { resetPasswordPath } from '../paths'

/**
 * The recovery email's link (specs/password-recovery PR-06, PR-13, design.md § 1, § 3). Does not
 * call Supabase: a mail scanner that opens the link first would spend the token. Keeps it in an
 * HttpOnly cookie and goes to the page without it in the URL; the page tells an expired link.
 */
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const token = recoveryToken(params)
  const response = NextResponse.redirect(
    new URL(resetPasswordPath(params.get('next')), request.nextUrl.origin),
  )
  if (token) {
    response.cookies.set(RECOVERY_COOKIE, token, {
      httpOnly: true,
      // Lax: the click from the email is a top-level navigation, which carries it.
      sameSite: 'lax',
      secure: secureCookies(),
      path: '/',
      maxAge: RECOVERY_MAX_AGE,
    })
  }
  return response
}
