'use client'

import dynamic from 'next/dynamic'
import { useGateDialog } from '@/components/organisms/auth-gate'
import { useRouter } from '@/i18n/navigation'
import { FormSkeleton } from './form-skeleton'

// Loaded when the modal shows them: they bring zod to the browser (seo.md § Zod, AU-19).
const LogInForm = dynamic(() => import('./log-in-form').then((mod) => mod.LogInForm), {
  ssr: false,
  loading: () => <FormSkeleton fields={2} />,
})
const SignUpForm = dynamic(() => import('./sign-up-form').then((mod) => mod.SignUpForm), {
  ssr: false,
  loading: () => <FormSkeleton fields={2} />,
})

/**
 * The forms of the account modal (specs/auth AU-01, AU-02, AU-07): the layout gives them to the
 * modal, which knows nothing of features. Done, the modal closes and the page is already rendered
 * again with the session; an account without a username goes to choose one (AU-11).
 */
export function AuthGateForms() {
  const dialog = useGateDialog()
  const router = useRouter()
  if (!dialog) return null

  function done({ needsProfile }: { needsProfile: boolean }) {
    dialog?.close()
    if (needsProfile) router.push({ pathname: '/welcome', query: { next: dialog?.next ?? '/' } })
  }

  return dialog.view === 'signup' ? <SignUpForm onDone={done} /> : <LogInForm onDone={done} />
}
