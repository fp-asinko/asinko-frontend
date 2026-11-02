import * as rootParams from 'next/root-params'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'
import { TIME_ZONE_COOKIE, validTimeZone } from '@/lib/time-zone'
import { routing, type Locale } from './routing'

/** The time zone of the cookie, if any and valid. */
async function viewerTimeZone() {
  return validTimeZone((await cookies()).get(TIME_ZONE_COOKIE)?.value)
}

export default getRequestConfig(async ({ locale, requestLocale }) => {
  // Explicit locale first, then one set with setRequestLocale (Server Actions: next/root-params
  // does not run there), then the [locale] root param of the page.
  const requested = locale ?? (await requestLocale)
  let resolved: Locale
  if (hasLocale(routing.locales, requested)) resolved = requested
  else {
    const param = await rootParams.locale()
    if (!hasLocale(routing.locales, param)) notFound()
    resolved = param
  }

  return {
    locale: resolved,
    messages: (await import(`../../messages/${resolved}.json`)).default,
    // The viewer's zone, from the cookie their browser writes (specs/local-time LT-02); UTC until
    // then. The client provider inherits it: dates never mismatch on hydration. Only for a request:
    // an explicit locale is the share images and metadata, built without one (no cookies there).
    timeZone: (locale ? null : await viewerTimeZone()) ?? 'UTC',
  }
})
