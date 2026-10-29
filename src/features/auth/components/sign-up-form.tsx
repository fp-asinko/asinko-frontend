'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useId } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { signUp } from '../actions/sign-up.action'
import { useAuthForm } from '../hooks/use-auth-form'
import { signUpSchema, type SignUpInput } from '../schemas/auth.schema'
import { AcceptTerms } from './accept-terms'
import { AuthField, FormAlert } from './auth-field'

/**
 * Create the account in one step (specs/auth AU-05 to AU-09): email, password, username, and age
 * and terms. Create stays blocked until those are accepted. Loaded on first use (seo.md § Zod).
 * `onDone` says whether the account still needs a username (AU-09).
 */
export function SignUpForm({ onDone }: { onDone: (result: { needsProfile: boolean }) => void }) {
  const t = useTranslations('auth')
  const ids = useId()
  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', username: '', accepted: false },
  })
  const accepted = useWatch({ control: form.control, name: 'accepted' })
  const { submit, pending, alert, error } = useAuthForm(form, signUp, onDone)

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      <FormAlert message={alert} />
      <AuthField
        id={`${ids}-email`}
        label={t('fields.email.label')}
        type="email"
        autoComplete="email"
        inputMode="email"
        autoCapitalize="none"
        field={form.register('email')}
        error={error('email')}
      />
      <AuthField
        id={`${ids}-password`}
        label={t('fields.password.label')}
        hint={t('fields.password.hint')}
        type="password"
        autoComplete="new-password"
        reveal
        field={form.register('password')}
        error={error('password')}
      />
      <AuthField
        id={`${ids}-username`}
        label={t('fields.username.label')}
        hint={t('fields.username.hint')}
        autoComplete="username"
        autoCapitalize="none"
        field={form.register('username')}
        error={error('username')}
      />
      <AcceptTerms id={`${ids}-accepted`} control={form.control} error={error('accepted')} />
      <Button
        type="submit"
        size="lg"
        disabled={!accepted}
        aria-disabled={pending || undefined}
        className="h-11 rounded-full text-[0.875rem] font-semibold"
      >
        {pending ? t('signup.pending') : t('signup.submit')}
      </Button>
    </form>
  )
}
