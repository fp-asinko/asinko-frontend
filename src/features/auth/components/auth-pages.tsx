import { getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'
import { SocialLogins } from '@/components/organisms/auth-gate'
import { Link } from '@/i18n/navigation'
import { LoginPageForm, WelcomePageForm } from './page-forms'
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
 * there is no JavaScript to open the modal. `mode` switches between logging in and signing up.
 */
export async function LoginView({
  mode,
  next,
  googleFailed,
}: {
  mode: 'login' | 'signup'
  next: string
  googleFailed: boolean
}) {
  const t = await getTranslations('authGate')
  const other = mode === 'login' ? 'signup' : 'login'

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
