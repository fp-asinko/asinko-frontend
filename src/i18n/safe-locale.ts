import { routing, type Locale } from './routing'

// Apart from routing.ts, which the browser loads with the localized navigation: only the server
// reads route params.

/** A locale from a route param, or the default when it is not one of ours. */
export function safeLocale(locale: string): Locale {
  return routing.locales.find((each) => each === locale) ?? routing.defaultLocale
}
