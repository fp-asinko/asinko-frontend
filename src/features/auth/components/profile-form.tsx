'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useId } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { createProfile } from '../actions/create-profile.action'
import { useAuthForm } from '../hooks/use-auth-form'
import { profileSchema, type ProfileInput } from '../schemas/auth.schema'
import { AcceptTerms } from './accept-terms'
import { AuthField, FormAlert } from './auth-field'

/**
 * Choose your username (specs/auth AU-11): after Google for the first time, or when signing up
 * could not create the profile (AU-09). Loaded after the page (seo.md § Zod).
 */
export function ProfileForm({ onDone }: { onDone: () => void }) {
  const t = useTranslations('auth')
  const ids = useId()
  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { username: '', accepted: false },
  })
  const accepted = useWatch({ control: form.control, name: 'accepted' })
  const { submit, pending, alert, error } = useAuthForm(form, createProfile, onDone)

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-3.5">
      <FormAlert message={alert} />
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
        className="mt-1 h-11 rounded-full text-[0.875rem] font-semibold disabled:opacity-35"
      >
        {pending ? t('welcome.pending') : t('welcome.submit')}
      </Button>
    </form>
  )
}
