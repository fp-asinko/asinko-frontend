import type { MetadataRoute } from 'next'

export type AppEnv = 'development' | 'preview' | 'production'

/** Only production is indexable (F-31, security.md § Ambientes no productivos). */
export function isIndexable(appEnv: AppEnv): boolean {
  return appEnv === 'production'
}

export function buildRobots(appEnv: AppEnv, siteUrl: string): MetadataRoute.Robots {
  if (!isIndexable(appEnv)) return { rules: { userAgent: '*', disallow: '/' } }

  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: new URL('/sitemap.xml', siteUrl).toString(),
  }
}
