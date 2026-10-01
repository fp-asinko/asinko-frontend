import type { MetadataRoute } from 'next'
import { env } from '@/env'
import { buildAlternates } from '@/i18n/alternates'
import { routing } from '@/i18n/routing'

// One entry per page in the default locale, with every language as an alternate (seo.md).
// Each view's spec adds its routes here.
const PAGES = ['/'] as const

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map((href) => {
    const { canonical, languages } = buildAlternates(
      env.NEXT_PUBLIC_SITE_URL,
      routing.defaultLocale,
      href,
    )
    return { url: canonical, alternates: { languages } }
  })
}
