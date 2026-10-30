'use client'

import dynamic from 'next/dynamic'
import { useRouter } from '@/i18n/navigation'
import { FormSkeleton } from './form-skeleton'

// After the page, with a skeleton in their place: they bring zod (seo.md § Zod, AU-19).
const LogInForm = dynamic(() => import('./log-in-form').then((mod) => mod.LogInForm), {
  ssr: false,
  loading: () => <FormSkeleton fields={2} />,
})
const SignUpForm = dynamic(() => import('./sign-up-form').then((mod) => mod.SignUpForm), {
  ssr: false,
  loading: () => <FormSkeleton fields={2} />,
})
const ProfileForm = dynamic(() => import('./profile-form').then((mod) => mod.ProfileForm), {
  ssr: false,
  loading: () => <FormSkeleton fields={2} />,
})

/**
 * `next` is a path of this site, with its locale (safeNext on the server): a full navigation, so
 * the page comes with the session from the start.
 */
function goTo(next: string) {
  window.location.assign(next)
}

/** The forms of the login page (specs/auth AU-03): back to `next` when done. */
export function LoginPageForm({ mode, next }: { mode: 'login' | 'signup'; next: string }) {
  const router = useRouter()
  function done({ needsProfile }: { needsProfile: boolean }) {
    if (needsProfile) router.replace({ pathname: '/welcome', query: { next } })
    else goTo(next)
  }
  return mode === 'signup' ? <SignUpForm onDone={done} /> : <LogInForm onDone={done} />
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
