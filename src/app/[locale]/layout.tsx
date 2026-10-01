import { HouseIcon } from 'lucide-react'
import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { AppShell, type NavItem } from '@/components/organisms/app-shell'
import { routing } from '@/i18n/routing'
import { Providers } from './providers'
import '../globals.css'

// Root layout: [locale] is the top segment so next/root-params can read it anywhere on the server.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata')
  return { title: t('title'), description: t('description') }
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
