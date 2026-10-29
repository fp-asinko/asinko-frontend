'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useId } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { logIn } from '../actions/log-in.action'
import { useAuthForm } from '../hooks/use-auth-form'
import { logInSchema, type LogInInput } from '../schemas/auth.schema'
import { AuthField, FormAlert } from './auth-field'

/**
 * Log in with email and password (specs/auth AU-02, AU-04). Loaded on first use: it brings zod to
 * the browser (seo.md § Zod). `onDone` says whether the account still needs a username.
 */
export function LogInForm({ onDone }: { onDone: (result: { needsProfile: boolean }) => void }) {
  const t = useTranslations('auth')
  const ids = useId()
  const form = useForm<LogInInput>({
    resolver: zodResolver(logInSchema),
    defaultValues: { email: '', password: '' },
  })
  const { submit, pending, alert, error } = useAuthForm(form, logIn, onDone)

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
        type="password"
        autoComplete="current-password"
        reveal
        field={form.register('password')}
        error={error('password')}
      />
      <Button
        type="submit"
        size="lg"
        aria-disabled={pending || undefined}
        className="mt-1 h-11 rounded-full text-[0.875rem] font-semibold disabled:opacity-35"
      >
        {pending ? t('login.pending') : t('login.submit')}
      </Button>
    </form>
  )
}
