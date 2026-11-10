'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useEffect, useId, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { requestRecovery } from '../actions/request-recovery.action'
import { useAuthForm } from '../hooks/use-auth-form'
import { useFocusFirst } from '../hooks/use-focus-first'
import { recoverSchema, type RecoverInput } from '../schemas/auth.schema'
import { AuthField, FormAlert } from './auth-field'

/** Supabase's minimum between two emails to the same address (PR-05). */
export const RESEND_SECONDS = 60

/**
 * Asks for the email to choose a new password (specs/password-recovery PR-02 to PR-05). Once
 * sent, the same confirmation whether the account exists or not (PR-12), and "Send it again"
 * after a minute. Loaded on first use: it brings zod to the browser (seo.md § Zod).
 */
export function RecoverForm({
  defaultEmail = '',
  next,
  focusFirst = false,
}: {
  defaultEmail?: string
  next: string
  /** It takes another form's place: the focus goes to the email (PR-16). */
  focusFirst?: boolean
}) {
  const t = useTranslations('auth')
  const ids = useId()
  const form = useForm<RecoverInput>({
    resolver: zodResolver(recoverSchema),
    defaultValues: { email: defaultEmail },
  })
  const [sentTo, setSentTo] = useState<string | null>(null)
  // Each email sent, the first or again: the confirmation takes the focus and is read again.
  const [sends, setSends] = useState(0)
  const [wait, setWait] = useState(0)
  const status = useRef<HTMLParagraphElement>(null)
  const { submit, pending, alert, error } = useAuthForm(
    form,
    (values) => requestRecovery({ ...values, next }),
    () => {
      setSentTo(form.getValues('email').trim())
      setSends((count) => count + 1)
      setWait(RESEND_SECONDS)
    },
  )
  useFocusFirst(form, 'email', focusFirst)

  useEffect(() => {
    if (wait <= 0) return
    const timer = setTimeout(() => setWait((left) => left - 1), 1000)
    return () => clearTimeout(timer)
  }, [wait])

  // The form leaves with the focus in it: the confirmation takes it, and is read (PR-16). Sent
  // again, the same: the button says nothing about it.
  useEffect(() => {
    if (sends > 0) status.current?.focus()
  }, [sends])

  const blocked = pending || wait > 0

  if (sentTo !== null) {
    return (
      <div className="flex flex-col gap-3.5">
        {/* No outline: only the code focuses it, to have it read (as the shell's main). */}
        <p ref={status} tabIndex={-1} role="status" className="type-ui outline-none">
          {t('recover.sent', { email: sentTo })}
        </p>
        <FormAlert message={alert} />
        <Button
          type="button"
          variant="secondary"
          size="lg"
          aria-disabled={blocked || undefined}
          // A fixed name: a countdown in it would be read again every second.
          aria-label={t('recover.resend')}
          onClick={(event) => {
            if (!blocked) void submit(event)
          }}
          className="h-11 rounded-full bg-muted font-semibold hover:bg-muted-hover aria-disabled:opacity-50"
        >
          <span aria-hidden>
            {pending
              ? t('recover.pending')
              : wait > 0
                ? t('recover.resendIn', { seconds: wait })
                : t('recover.resend')}
          </span>
        </Button>
      </div>
    )
  }

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
      <Button
        type="submit"
        size="lg"
        aria-disabled={pending || undefined}
        className="mt-1 h-11 rounded-full font-semibold aria-disabled:opacity-35"
      >
        {pending ? t('recover.pending') : t('recover.submit')}
      </Button>
    </form>
  )
}
