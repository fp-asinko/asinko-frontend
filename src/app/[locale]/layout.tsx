import { HouseIcon } from 'lucide-react'
import { Suspense } from 'react'
import type { Metadata, Viewport } from 'next'
import { Figtree } from 'next/font/google'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { AppShell, type NavItem } from '@/components/organisms/app-shell'
import { UserAvatar } from '@/components/molecules/user-avatar'
import { AuthGateProvider } from '@/components/organisms/auth-gate'
import { JoinedProvider } from '@/components/organisms/join'
import { RightColumn } from '@/components/organisms/right-column'
import { env } from '@/env'
import { ComposerRoot } from '@/features/composer'
import { InterestsSidebar, InterestsSkeleton } from '@/features/interests'
import { OG_LOCALES } from '@/i18n/alternates'
import { pickClientMessages } from '@/i18n/client-messages'
import { routing } from '@/i18n/routing'
import { isIndexable } from '@/lib/seo/robots'
import { getViewer } from '@/lib/session'
import { isDevLoginEnabled } from '@/lib/auth/dev-session'
import { DevLoginButton } from '@/features/dev-login'
import { Providers } from './providers'
import '../globals.css'

// The prototype's typeface (specs/home/design.md §2). next/font downloads it at build time and
// serves it from this site: the browser never contacts Google (CSP font-src 'self').
const figtree = Figtree({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-figtree',
})

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
  // The browser gets only the namespaces its Client Components use (i18n.md).
  const clientMessages = pickClientMessages(await getMessages())
  // Who can act: without a session, actions open the account modal (specs/guest-experience).
  const viewer = await getViewer()
  const signedIn = viewer !== null
  // Development login (specs/dev-login): off in production and with every route mocked.
  const devTools =
    isDevLoginEnabled() && env.API_MOCKS !== 'all' ? (
      <DevLoginButton username={viewer?.username ?? null} />
    ) : null

  // Only views that exist (F-23b): each view's spec registers its own item.
  const navItems: NavItem[] = [{ href: '/', label: t('home'), icon: <HouseIcon /> }]

  return (
    // next-themes sets the theme class on <html> before hydration.
    <html lang={locale} className={figtree.variable} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider messages={clientMessages}>
          <Providers nonce={nonce}>
            <AuthGateProvider
              signedIn={signedIn}
              viewerAvatar={viewer && <UserAvatar name={viewer.username} size="xs" />}
            >
              {/* Joined communities of this visit: every join button hides at once (specs/community-first). */}
              <JoinedProvider>
                {/* The post editor behind every "Create" (specs/post-create-detail § 2). */}
                <ComposerRoot>
                  <AppShell
                    navItems={navItems}
                    sidebar={
                      // Streamed: the shell and the page never wait for the column's data
                      // (specs/feed-navigation FN-08), as a language switch re-renders the layout.
                      <Suspense fallback={<InterestsSkeleton />}>
                        <InterestsSidebar />
                      </Suspense>
                    }
                    right={<RightColumn />}
                    devTools={devTools}
                  >
                    {children}
                  </AppShell>
                </ComposerRoot>
              </JoinedProvider>
            </AuthGateProvider>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
