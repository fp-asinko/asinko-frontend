import { getPathname } from './navigation'
import { routing, type Locale } from './routing'

type Href = Parameters<typeof getPathname>[0]['href']

/** Absolute localized URL of an app pathname (respects translated pathnames). */
export function localizedUrl(siteUrl: string, locale: Locale, href: Href): string {
  return new URL(getPathname({ href, locale }), siteUrl).toString()
}

/**
 * seo.md § Multi-idioma: self-referencing canonical per locale, hreflang for every locale and
 * x-default pointing to the default locale (en).
 */
export function buildAlternates(siteUrl: string, locale: Locale, href: Href) {
  const languages: Record<string, string> = {}
  for (const each of routing.locales) languages[each] = localizedUrl(siteUrl, each, href)
  languages['x-default'] = localizedUrl(siteUrl, routing.defaultLocale, href)

  return { canonical: localizedUrl(siteUrl, locale, href), languages }
}

/** og:locale needs language_TERRITORY. pt is Brazilian Portuguese (i18n.md). */
export const OG_LOCALES: Record<Locale, string> = { en: 'en_US', es: 'es_LA', pt: 'pt_BR' }
