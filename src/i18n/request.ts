import * as rootParams from 'next/root-params'
import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'
import { routing, type Locale } from './routing'

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
    // Same zone on server and client, so formatted dates never mismatch on hydration. The UI shows
    // relative times ("2 hours ago"), which do not depend on it.
    timeZone: 'UTC',
  }
})
