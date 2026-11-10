import { getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'
import { SocialLogins } from '@/components/organisms/auth-gate'
import { Link } from '@/i18n/navigation'
import { LoginPageForm, ResetPasswordPageForm, WelcomePageForm } from './page-forms'
import { LogOutButton } from './log-out-button'

function AuthCard({
  title,
  intro,
  children,
}: {
  title: string
  intro?: string
  children: ReactNode
}) {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-5 px-4 py-8 md:py-12">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-[1.375rem] leading-tight font-bold">{title}</h1>
        {intro && <p className="type-ui text-muted-foreground">{intro}</p>}
      </div>
      {children}
    </div>
  )
}

/**
 * The login page (specs/auth AU-03): the modal's forms as a page, for direct links and when
 * there is no JavaScript to open the modal. `mode` switches between logging in, signing up and
 * asking for the email to choose a new password (specs/password-recovery PR-01).
 */
export async function LoginView({
  mode,
  next,
  googleFailed,
}: {
  mode: 'login' | 'signup' | 'recover'
  next: string
  googleFailed: boolean
}) {
  const t = await getTranslations('authGate')
  const other = mode === 'login' ? 'signup' : 'login'

  if (mode === 'recover') {
    return (
      <AuthCard title={t('title.recover')} intro={t('recoverValue')}>
        <LoginPageForm mode="recover" next={next} />
        <Link
          href={{ pathname: '/login', query: { next } }}
          className="mx-auto inline-flex min-h-6 items-center type-ui font-semibold text-foreground underline underline-offset-2"
        >
          {t('backToLogin')}
        </Link>
      </AuthCard>
    )
  }

  return (
    <AuthCard title={t(`title.${mode}`)}>
      {googleFailed && (
        <p role="alert" className="type-ui text-destructive">
          {(await getTranslations('auth.errors'))('google')}
        </p>
      )}
      <LoginPageForm mode={mode} next={next} />
      <p className="text-center type-ui text-muted-foreground">
        {t.rich(mode === 'login' ? 'switch.toSignup' : 'switch.toLogin', {
          link: (chunks) => (
            <Link
              href={{ pathname: '/login', query: { mode: other, next } }}
              className="font-semibold text-foreground underline underline-offset-2"
            >
              {chunks}
            </Link>
          ),
        })}
      </p>
      <div className="flex items-center gap-3 type-meta text-muted-foreground">
        <span aria-hidden className="h-px flex-1 bg-border" />
        {t('or')}
        <span aria-hidden className="h-px flex-1 bg-border" />
      </div>
      <SocialLogins next={next} />
    </AuthCard>
  )
}

/** The welcome screen (specs/auth AU-11, AU-21), with the way out: logging out. */
export async function WelcomeView({
  next,
  suggestion,
  suggestedName = null,
}: {
  next: string
  suggestion: string | null
  /** Google's name, for the display name (design.md § 16). */
  suggestedName?: string | null
}) {
  const t = await getTranslations('auth.welcome')
  return (
    <AuthCard title={t('title')} intro={t('intro')}>
      <WelcomePageForm next={next} suggestion={suggestion} suggestedName={suggestedName} />
      <LogOutButton />
    </AuthCard>
  )
}

/**
 * Choosing a new password from the email's link (specs/password-recovery PR-06, PR-08).
 * `hasLink`: /auth/reset left the link's cookie; without it, the page says it expired.
 */
export async function ResetPasswordView({ next, hasLink }: { next: string; hasLink: boolean }) {
  const t = await getTranslations('auth.reset')
  return (
    <AuthCard title={t('title')} intro={hasLink ? t('intro') : undefined}>
      <ResetPasswordPageForm next={next} hasLink={hasLink} />
    </AuthCard>
  )
}
