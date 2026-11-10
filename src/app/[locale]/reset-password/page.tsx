import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { ResetPasswordView } from '@/features/auth/components/auth-pages'
import { safeLocale } from '@/i18n/safe-locale'
import { safeNext } from '@/lib/auth/next'
import { readRecovery } from '@/lib/auth/recovery-cookie'

// Choosing a new password from the email's link (specs/password-recovery PR-06, design.md § 3).
// Outside (main), as /login. It does not send a session away: one can come from the email too.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth.reset')
  return { title: t('title'), robots: { index: false, follow: false } }
}

export default async function ResetPasswordRoute({
  params,
  searchParams,
}: PageProps<'/[locale]/reset-password'>) {
  const locale = safeLocale((await params).locale)
  const next = safeNext((await searchParams).next, `/${locale}`)
  return <ResetPasswordView next={next} hasLink={(await readRecovery()) !== null} />
}
