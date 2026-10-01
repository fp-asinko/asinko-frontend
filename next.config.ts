import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

// Validates environment variables at build time (F-29, F-30).
import './src/env'

const withNextIntl = createNextIntlPlugin()

const nextConfig: NextConfig = {}

export default withNextIntl(nextConfig)
