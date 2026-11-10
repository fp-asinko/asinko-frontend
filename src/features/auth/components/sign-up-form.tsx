'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useId } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { signUp } from '../actions/sign-up.action'
import { useAuthForm } from '../hooks/use-auth-form'
import { useFocusFirst } from '../hooks/use-focus-first'
import { signUpSchema, type SignUpInput } from '../schemas/auth.schema'
import { AuthField, FormAlert } from './auth-field'

/**
 * Create the account (specs/auth AU-05 to AU-08, design.md § 11): only email and password. The
 * username, the photo and the terms come right after, in the welcome screen. Loaded on first use
 * (seo.md § Zod).
 */
export function SignUpForm({
  onDone,
  focusFirst = false,
}: {
  onDone: (result: { needsProfile: boolean; suggestion?: string | null }) => void
  /** It takes another form's place: the focus goes to its first field. */
  focusFirst?: boolean
}) {
  const t = useTranslations('auth')
  const ids = useId()
  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '' },
  })
  const { submit, pending, alert, error } = useAuthForm(form, signUp, onDone)
  useFocusFirst(form, 'email', focusFirst)

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-3.5">
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
      <Button
        type="submit"
        size="lg"
        aria-disabled={pending || undefined}
        className="mt-1 h-11 rounded-full font-semibold aria-disabled:opacity-35"
      >
        {pending ? t('signup.pending') : t('signup.submit')}
      </Button>
    </form>
  )
}
