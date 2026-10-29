import { routing } from '@/i18n/routing'

// Where Google's way back lands (specs/auth AU-10, AU-11), in the language of the page the person
// was on: the Route Handlers live outside the locale.

/** The locale of a path of this site (es for `/es/hub/macro`), or the default one. */
export function localeOf(path: string): string {
  const first = path.split(/[/?#]/)[1] ?? ''
  return (routing.locales as readonly string[]).includes(first) ? first : routing.defaultLocale
}

/** Where to choose the username, coming back to `next` after it (AU-11). */
export function welcomePath(next: string): string {
  return `/${localeOf(next)}/welcome?next=${encodeURIComponent(next)}`
}

/** The login page saying Google did not work, coming back to `next` after it. */
export function googleErrorPath(next: string): string {
  return `/${localeOf(next)}/login?error=google&next=${encodeURIComponent(next)}`
}
