import { NextResponse, type NextRequest } from 'next/server'
import { OAUTH_COOKIE, OAUTH_MAX_AGE, startGoogle } from '@/lib/auth/google'
import { googleErrorPath } from '../paths'
import { safeNext } from '@/lib/auth/next'
import { secureCookies } from '@/lib/auth/session'
import { supabaseAuth } from '@/lib/auth/supabase'

/**
 * "Continue with Google" (specs/auth AU-10): a plain link, so it works without JavaScript. Keeps
 * the PKCE verifier and where the person was, and sends them to Supabase.
 */
export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get('next')
  if (!supabaseAuth) {
    return NextResponse.redirect(new URL(googleErrorPath(safeNext(next)), request.nextUrl.origin))
  }
  const { url, cookie } = await startGoogle(supabaseAuth, request.nextUrl.origin, next)
  const response = NextResponse.redirect(url)
  response.cookies.set(OAUTH_COOKIE, cookie, {
    httpOnly: true,
    // Lax: the way back from Google is a top-level navigation, which carries it.
    sameSite: 'lax',
    secure: secureCookies(),
    path: '/auth',
    maxAge: OAUTH_MAX_AGE,
  })
  return response
}
