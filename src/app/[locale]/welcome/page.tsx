import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { WelcomeView } from '@/features/auth/components/auth-pages'
import { splitLocale } from '@/i18n/locale-path'
import { redirect } from '@/i18n/navigation'
import { safeLocale } from '@/i18n/safe-locale'
import { safeNext } from '@/lib/auth/next'
import { readSession } from '@/lib/auth/session'
import { getAccountState } from '@/lib/session'

// Choose your username (specs/auth AU-11): only for an account without one. Outside (main) and
// without loading.tsx: it redirects everyone else before sending anything.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth.welcome')
  return { title: t('title'), robots: { index: false, follow: false } }
}

export default async function WelcomeRoute({
  params,
  searchParams,
}: PageProps<'/[locale]/welcome'>) {
  const locale = safeLocale((await params).locale)
  const next = safeNext((await searchParams).next, `/${locale}`)

  const state = await getAccountState()
  if (state === 'ready') redirect(splitLocale(next))
  if (state === 'guest') redirect({ href: { pathname: '/login', query: { next } }, locale })

  return <WelcomeView next={next} suggestion={(await readSession())?.suggestion ?? null} />
}
