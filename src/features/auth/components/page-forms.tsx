'use client'

import dynamic from 'next/dynamic'
import { arriving } from '@/components/molecules/arriving'
import { useRouter } from '@/i18n/navigation'
import { FormSkeleton } from './form-skeleton'
import { rememberedEmail, rememberEmail } from './recover-email'

// After the page, with a skeleton in their place: they bring zod (seo.md § Zod, AU-19).
const LogInForm = dynamic(() => import('./log-in-form').then((mod) => arriving(mod.LogInForm)), {
  ssr: false,
  loading: () => <FormSkeleton fields={2} />,
})
const SignUpForm = dynamic(() => import('./sign-up-form').then((mod) => arriving(mod.SignUpForm)), {
  ssr: false,
  loading: () => <FormSkeleton fields={2} />,
})
const RecoverForm = dynamic(
  () => import('./recover-form').then((mod) => arriving(mod.RecoverForm)),
  { ssr: false, loading: () => <FormSkeleton fields={1} /> },
)
const ResetPasswordForm = dynamic(
  () => import('./reset-password-form').then((mod) => arriving(mod.ResetPasswordForm)),
  { ssr: false, loading: () => <FormSkeleton fields={1} /> },
)
const ProfileForm = dynamic(
  () => import('./profile-form').then((mod) => arriving(mod.ProfileForm)),
  {
    ssr: false,
    loading: () => <FormSkeleton fields={2} />,
  },
)

/**
 * `next` is a path of this site, with its locale (safeNext on the server): a full navigation, so
 * the page comes with the session from the start.
 */
function goTo(next: string) {
  window.location.assign(next)
}

/**
 * The forms of the login page (specs/auth AU-03): back to `next` when done. `recover` asks for
 * the email to choose a new password (specs/password-recovery PR-01), with the one written.
 */
export function LoginPageForm({
  mode,
  next,
}: {
  mode: 'login' | 'signup' | 'recover'
  next: string
}) {
  const router = useRouter()
  function done({ needsProfile }: { needsProfile: boolean }) {
    if (needsProfile) router.replace({ pathname: '/welcome', query: { next } })
    else goTo(next)
  }
  if (mode === 'recover') return <RecoverForm defaultEmail={rememberedEmail()} next={next} />
  if (mode === 'signup') return <SignUpForm onDone={done} />
  return (
    <LogInForm
      onDone={done}
      onForgot={(email) => {
        rememberEmail(email)
        router.replace({ pathname: '/login', query: { mode: 'recover', next } })
      }}
    />
  )
}

/** Choosing the new password, from the email's link (specs/password-recovery PR-06). */
export function ResetPasswordPageForm({ next, hasLink }: { next: string; hasLink: boolean }) {
  return <ResetPasswordForm next={next} hasLink={hasLink} />
}

/** Choosing the username (specs/auth AU-11): back to `next` when done. */
export function WelcomePageForm({
  next,
  suggestion,
  suggestedName = null,
}: {
  next: string
  suggestion: string | null
  suggestedName?: string | null
}) {
  return (
    <ProfileForm suggestion={suggestion} suggestedName={suggestedName} onDone={() => goTo(next)} />
  )
}
