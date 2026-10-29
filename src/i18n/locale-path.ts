import { routing, type Locale } from './routing'

/**
 * A path of this site split into its locale and the rest (`/es/hub/macro` → es, `/hub/macro`), for
 * the localized redirect, which adds the prefix itself. A path without a known locale is the
 * default one's. Used with `next` after logging in (specs/auth AU-03).
 */
export function splitLocale(path: string): { locale: Locale; href: string } {
  const match = /^\/([^/?#]+)(.*)$/.exec(path)
  const first = match?.[1] ?? ''
  if ((routing.locales as readonly string[]).includes(first)) {
    const rest = match?.[2] ?? ''
    return { locale: first as Locale, href: rest.startsWith('/') ? rest : `/${rest}` }
  }
  return { locale: routing.defaultLocale, href: path }
}
