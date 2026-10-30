import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { env } from './env'
import { routing } from './i18n/routing'
import { findProfile } from './lib/auth/account'
import { refreshSession } from './lib/auth/refresh-session'
import { SESSION_COOKIE, sessionCookieOptions } from './lib/auth/session-cookie'
import { supabaseAuth } from './lib/auth/supabase'
import { buildCsp, createNonce } from './lib/security/csp'
import { isMalformedPath } from './lib/security/malformed-path'

const handleI18nRouting = createMiddleware(routing)

// Locale routing (F-11, F-12) + CSP with a per-request nonce (F-27, F-28) + the session renewed
// before anything calls the API (specs/auth AU-13).
// Next.js reads the nonce from the *request* CSP header while rendering, so the policy is set on a
// copy of the request that next-intl forwards to the render, and repeated on the response. The
// renewed session goes the same way: on the request for this render, and on the response for the
// browser.
export default async function proxy(request: NextRequest) {
  // An undecodable path is a bad request: left to Next.js it ends in a 500.
  if (isMalformedPath(request.nextUrl.pathname)) {
    return new NextResponse('Bad Request', {
      status: 400,
      headers: { 'Content-Type': 'text/plain' },
    })
  }
  const nonce = createNonce()
  const csp = buildCsp({
    nonce,
    isDev: env.NODE_ENV === 'development',
    siteUrl: env.NEXT_PUBLIC_SITE_URL,
    sentryDsn: env.NEXT_PUBLIC_SENTRY_DSN,
  })

  const session = await refreshSession(
    request.cookies.get(SESSION_COOKIE)?.value,
    supabaseAuth,
    Date.now(),
    findProfile,
  )
  if (session.kind === 'renewed') request.cookies.set(SESSION_COOKIE, session.value)
  if (session.kind === 'ended') request.cookies.delete(SESSION_COOKIE)

  const headers = new Headers(request.headers)
  headers.set('x-nonce', nonce)
  headers.set('Content-Security-Policy', csp)

  const response = handleI18nRouting(new NextRequest(request, { headers }))
  response.headers.set('Content-Security-Policy', csp)
  if (session.kind === 'renewed') {
    response.cookies.set(
      SESSION_COOKIE,
      session.value,
      sessionCookieOptions(env.NEXT_PUBLIC_SITE_URL.startsWith('https:')),
    )
  }
  if (session.kind === 'ended') response.cookies.delete(SESSION_COOKIE)
  return response
}

export const config = {
  // auth/: Google's way out and back (Route Handlers, specs/auth § 5), without a locale.
  matcher: '/((?!api|auth/|trpc|_next|_vercel|.*\\..*).*)',
}
