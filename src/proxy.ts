import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

// Locale detection and redirects (F-11, F-12). T-08 adds the CSP with nonce here.
export default createMiddleware(routing)

export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
}
