'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useId, useRef } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import type { ActionResult } from '@/lib/result'
import { createProfile } from '../actions/create-profile.action'
import { setAvatar } from '../actions/set-avatar.action'
import { useAuthForm } from '../hooks/use-auth-form'
import { profileSchema, type ProfileInput } from '../schemas/auth.schema'
import { AcceptTerms } from './accept-terms'
import { AuthField, FormAlert } from './auth-field'
import { AvatarPicker } from './avatar-picker'

/**
 * The welcome screen's form (specs/auth AU-11, AU-21, AU-23, design.md § 11, § 16): the username,
 * already suggested, an optional display name and photo, and age and terms. Creates the profile, then uploads the photo; if
 * only the photo failed, it says so and Continue tries it again (the profile already exists).
 * Loaded after the page (seo.md § Zod).
 */
export function ProfileForm({
  suggestion,
  suggestedName,
  onDone,
}: {
  suggestion?: string | null
  /** Back from Google, its name (AU-23, design.md § 16). */
  suggestedName?: string | null
  onDone: () => void
}) {
  const t = useTranslations('auth')
  const ids = useId()
  const photo = useRef<Blob | null>(null)
  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: suggestion ?? '',
      displayName: suggestedName ?? '',
      accepted: false,
    },
  })
  const accepted = useWatch({ control: form.control, name: 'accepted' })

  async function save(values: ProfileInput): Promise<ActionResult<null>> {
    const created = await createProfile(values)
    if (!created.ok) return created
    if (!photo.current) return { ok: true, data: null }
    const body = new FormData()
    body.set('file', photo.current)
    return setAvatar(body)
  }
  const { submit, pending, alert, error } = useAuthForm(form, save, onDone)

  return (
    <form noValidate onSubmit={submit} className="group/form flex flex-col gap-4">
      {/* While the photo is framed, only the cropper: Continue waits for it. */}
      <div className="contents group-has-data-framing/form:hidden">
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
        <AuthField
          id={`${ids}-display-name`}
          label={t('fields.displayName.label')}
          hint={t('fields.displayName.hint')}
          autoComplete="name"
          field={form.register('displayName')}
          error={error('displayName')}
        />
      </div>
      <AvatarPicker onChange={(blob) => (photo.current = blob)} />
      <div className="contents group-has-data-framing/form:hidden">
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
      </div>
    </form>
  )
}
