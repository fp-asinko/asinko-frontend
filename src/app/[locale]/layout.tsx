import { HouseIcon } from 'lucide-react'
import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { AppShell, type NavItem } from '@/components/organisms/app-shell'
import { env } from '@/env'
import { OG_LOCALES } from '@/i18n/alternates'
import { routing } from '@/i18n/routing'
import { isIndexable } from '@/lib/seo/robots'
import { Providers } from './providers'
import '../globals.css'

// Root layout: [locale] is the top segment so next/root-params can read it anywhere on the server.
// Defaults for every page (seo.md). Each page adds its canonical and hreflang (alternates).
export async function generateMetadata({ params }: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations('metadata')
  const title = t('title')

  return {
    metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
    title: { default: title, template: `%s · ${title}` },
    description: t('description'),
    applicationName: title,
    openGraph: {
      siteName: title,
      type: 'website',
      locale: hasLocale(routing.locales, locale) ? OG_LOCALES[locale] : undefined,
    },
    twitter: { card: 'summary' },
    // Outside production nothing is indexable (F-31, security.md).
    robots: isIndexable(env.APP_ENV) ? undefined : { index: false, follow: false },
  }
}

// viewport-fit=cover exposes the iPhone safe areas (notch, home indicator) to env().
export const viewport: Viewport = { viewportFit: 'cover' }

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  // Set by src/proxy.ts. Reading headers also keeps every page dynamic, which the nonce requires.
  const nonce = (await headers()).get('x-nonce') ?? undefined
  const t = await getTranslations('common.nav')

  // Only views that exist (F-23b): each view's spec registers its own item.
  const navItems: NavItem[] = [{ href: '/', label: t('home'), icon: <HouseIcon /> }]

  return (
    // next-themes sets the theme class on <html> before hydration.
    <html lang={locale} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider>
          <Providers nonce={nonce}>
            <AppShell navItems={navItems}>{children}</AppShell>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
