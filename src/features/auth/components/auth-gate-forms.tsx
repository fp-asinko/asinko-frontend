'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { useGateDialog } from '@/components/organisms/auth-gate'
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
const ProfileForm = dynamic(() => import('./profile-form').then((mod) => mod.ProfileForm), {
  ssr: false,
  loading: () => <FormSkeleton fields={2} />,
})

/**
 * The forms of the account modal (specs/auth AU-01, AU-02, AU-07, AU-11): the layout gives them
 * to the modal, which knows nothing of features. Creating the account (or logging in to one
 * without a username) goes on to the second step in the same modal: the username, already
 * suggested, the photo and the terms (design.md § 12). Done, the modal closes over the page,
 * already rendered again with the session.
 */
export function AuthGateForms({ suggestion = null }: { suggestion?: string | null }) {
  const dialog = useGateDialog()
  // From the step just done; the layout's (from the session) when back from Google.
  const [suggested, setSuggested] = useState<string | null>(null)
  if (!dialog) return null

  function done(result: { needsProfile: boolean; suggestion?: string | null }) {
    if (!result.needsProfile) {
      dialog?.close()
      return
    }
    setSuggested(result.suggestion ?? null)
    dialog?.setView('profile')
  }

  if (dialog.view === 'profile') {
    return <ProfileForm suggestion={suggested ?? suggestion} onDone={dialog.close} />
  }
  return dialog.view === 'signup' ? <SignUpForm onDone={done} /> : <LogInForm onDone={done} />
}
