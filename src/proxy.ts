import createMiddleware from 'next-intl/middleware'
import { NextRequest } from 'next/server'
import { env } from './env'
import { routing } from './i18n/routing'
import { buildCsp, createNonce } from './lib/security/csp'

const handleI18nRouting = createMiddleware(routing)

// Locale routing (F-11, F-12) + CSP with a per-request nonce (F-27, F-28).
// Next.js reads the nonce from the *request* CSP header while rendering, so the policy is set on a
// copy of the request that next-intl forwards to the render, and repeated on the response.
export default function proxy(request: NextRequest) {
  const nonce = createNonce()
  const csp = buildCsp({
    nonce,
    isDev: env.NODE_ENV === 'development',
    siteUrl: env.NEXT_PUBLIC_SITE_URL,
    sentryDsn: env.NEXT_PUBLIC_SENTRY_DSN,
  })

  const headers = new Headers(request.headers)
  headers.set('x-nonce', nonce)
  headers.set('Content-Security-Policy', csp)

  const response = handleI18nRouting(new NextRequest(request, { headers }))
  response.headers.set('Content-Security-Policy', csp)
  return response
}

export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
}
