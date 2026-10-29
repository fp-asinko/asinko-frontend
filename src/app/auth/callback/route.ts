import { NextResponse, type NextRequest } from 'next/server'
import { startSession } from '@/lib/auth/account'
import { finishGoogle, OAUTH_COOKIE } from '@/lib/auth/google'
import { googleErrorPath, welcomePath } from '../paths'
import { supabaseAuth } from '@/lib/auth/supabase'

/**
 * Back from Google (specs/auth AU-10, AU-11): exchanges the code with the verifier the person left,
 * starts the session, and goes back where they were, or to choose a username first. If anything
 * fails, the login page says so.
 */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin
  const result = supabaseAuth
    ? await finishGoogle(
        supabaseAuth,
        request.nextUrl.searchParams.get('code'),
        request.cookies.get(OAUTH_COOKIE)?.value,
      )
    : null
  const started = result?.ok ? await startSession(result.tokens) : null

  const next = result?.next ?? '/'
  const target = !started?.ok
    ? googleErrorPath(next)
    : started.session.username
      ? next
      : welcomePath(next)
  const response = NextResponse.redirect(new URL(target, origin))
  response.cookies.delete({ name: OAUTH_COOKIE, path: '/auth' })
  return response
}
