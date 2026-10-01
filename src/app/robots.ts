import type { MetadataRoute } from 'next'
import { env } from '@/env'
import { buildRobots } from '@/lib/seo/robots'

// Disallow everything outside production (F-31).
export default function robots(): MetadataRoute.Robots {
  return buildRobots(env.APP_ENV, env.NEXT_PUBLIC_SITE_URL)
}
