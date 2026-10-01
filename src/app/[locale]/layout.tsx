import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { Providers } from './providers'
import '../globals.css'

// Root layout: [locale] is the top segment so next/root-params can read it anywhere on the server.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata')
  return { title: t('title'), description: t('description') }
}

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  // Set by src/proxy.ts. Reading headers also keeps every page dynamic, which the nonce requires.
  const nonce = (await headers()).get('x-nonce') ?? undefined

  return (
    // next-themes sets the theme class on <html> before hydration.
    <html lang={locale} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider>
          <Providers nonce={nonce}>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
