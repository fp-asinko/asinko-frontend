import * as rootParams from 'next/root-params'
import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

export default getRequestConfig(async ({ locale }) => {
  let resolved = locale
  if (!resolved) {
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
