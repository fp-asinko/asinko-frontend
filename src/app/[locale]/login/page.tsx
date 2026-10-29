import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { LoginView } from '@/features/auth/components/auth-pages'
import { splitLocale } from '@/i18n/locale-path'
import { redirect } from '@/i18n/navigation'
import { safeLocale } from '@/i18n/safe-locale'
import { safeNext } from '@/lib/auth/next'
import { getAccountState } from '@/lib/session'

// Log in and sign up as a page (specs/auth AU-03). Outside (main) and without loading.tsx: it
// redirects with a session, before sending anything.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('authGate.title')
  return { title: t('login'), robots: { index: false, follow: false } }
}

export default async function LoginRoute({ params, searchParams }: PageProps<'/[locale]/login'>) {
  const locale = safeLocale((await params).locale)
  const query = await searchParams
  const next = safeNext(query.next, `/${locale}`)

  const state = await getAccountState()
  if (state === 'ready') redirect(splitLocale(next))
  if (state === 'needs-profile')
    redirect({ href: { pathname: '/welcome', query: { next } }, locale })

  return (
    <LoginView
      mode={query.mode === 'signup' ? 'signup' : 'login'}
      next={next}
      googleFailed={query.error === 'google'}
    />
  )
}
