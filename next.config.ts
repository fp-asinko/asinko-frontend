import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

// Validates environment variables at build time (F-29, F-30).
import './src/env'

const withNextIntl = createNextIntlPlugin()

// Fixed security headers for every response, assets included (security.md). The CSP is per-request
// and lives in src/proxy.ts because it carries a nonce.
const SECURITY_HEADERS = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }]
  },
}

export default withNextIntl(nextConfig)
