import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs/config'
import createNextIntlPlugin from 'next-intl/plugin'
import { REMOTE_IMAGE_HOSTS, REMOTE_IMAGE_PATH } from './src/lib/images'
import { isIndexable } from './src/lib/seo/robots'

// Validates environment variables at build time (F-29, F-30).
import { env } from './src/env'

const withNextIntl = createNextIntlPlugin()

// Fixed security headers for every response, assets included (security.md). The CSP is per-request
// and lives in src/proxy.ts because it carries a nonce.
const SECURITY_HEADERS = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // Non-production environments are invisible to crawlers (security.md, F-31): header + meta + robots.
  ...(isIndexable(env.APP_ENV) ? [] : [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]),
]

const nextConfig: NextConfig = {
  experimental: {
    // Going back to a feed tab seen in the last 30 s is instant, from the router cache
    // (specs/feed-navigation FN-04). Accepted: a vote cast meanwhile shows on that tab after 30 s.
    staleTimes: { dynamic: 30 },
    // A post image arrives already shrunk to WebP (at most 4 MB, src/lib/prepare-image.ts), under
    // Vercel's 4.5 MB request limit (specs/post-image § 1). The default is 1 MB.
    serverActions: { bodySizeLimit: '4.5mb' },
  },
  poweredByHeader: false,
  // The same allowlist the feed mappers use: an image from any other host is dropped before render.
  images: {
    remotePatterns: REMOTE_IMAGE_HOSTS.map((hostname) => ({
      protocol: 'https',
      hostname,
      pathname: `${REMOTE_IMAGE_PATH}**`,
    })),
  },
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }]
  },
}

// Sentry build integration. Source map upload stays off until the project and a CI token exist
// (design.md §9): set org/project/authToken here and remove `disable`.
export default withSentryConfig(withNextIntl(nextConfig), {
  silent: true,
  telemetry: false,
  sourcemaps: { disable: true },
})
