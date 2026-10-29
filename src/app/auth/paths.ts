import { routing } from '@/i18n/routing'

// Where Google's way back lands (specs/auth AU-10, AU-11), in the language of the page the person
// was on: the Route Handlers live outside the locale.

/** The locale of a path of this site (es for `/es/hub/macro`), or the default one. */
export function localeOf(path: string): string {
  const first = path.split(/[/?#]/)[1] ?? ''
  return (routing.locales as readonly string[]).includes(first) ? first : routing.defaultLocale
}

/**
 * Back where the person was, marked so the page opens the second step in the account modal: the
 * username, the photo and the terms (AU-11, design.md § 12). Without JavaScript, /welcome.
 */
export function welcomePath(next: string): string {
  const url = new URL(next, 'http://site')
  url.searchParams.set('welcome', '1')
  return `${url.pathname}${url.search}`
}

/** The login page saying Google did not work, coming back to `next` after it. */
export function googleErrorPath(next: string): string {
  return `/${localeOf(next)}/login?error=google&next=${encodeURIComponent(next)}`
}
