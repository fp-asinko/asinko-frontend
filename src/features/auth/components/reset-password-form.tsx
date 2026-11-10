'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useEffect, useId, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { notify } from '@/components/organisms/toaster/notify'
import { Button } from '@/components/ui/button'
import { Link, useRouter } from '@/i18n/navigation'
import { splitLocale } from '@/i18n/locale-path'
import { resetPassword } from '../actions/reset-password.action'
import { useAuthForm } from '../hooks/use-auth-form'
import { newPasswordSchema, type NewPasswordInput } from '../schemas/auth.schema'
import { AuthField, FormAlert } from './auth-field'

const EXPIRED = 'auth.reset.expired'

/**
 * Chooses the new password (specs/password-recovery PR-06 to PR-10). Without the email's link, or
 * when Supabase says it expired, offers a new one (PR-08). Done, back to `next` with the session
 * and a toast; an account without a username goes to the welcome step first (PR-10). Loaded after
 * the page: it brings zod and the toasts (seo.md § Zod).
 */
export function ResetPasswordForm({ next, hasLink }: { next: string; hasLink: boolean }) {
  const t = useTranslations('auth')
  const ids = useId()
  const router = useRouter()
  const [expired, setExpired] = useState(!hasLink)
  const form = useForm<NewPasswordInput>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: '' },
  })
  const { submit, pending, alert, error } = useAuthForm(
    form,
    async (values) => {
      const result = await resetPassword(values)
      if (!result.ok && result.error === EXPIRED) setExpired(true)
      return result
    },
    ({ needsProfile }) => {
      notify({ message: t('reset.done'), kind: 'success' })
      if (needsProfile) {
        router.replace({ pathname: '/welcome', query: { next } })
        return
      }
      // A client navigation: the toast stays, and the action already rendered the page again.
      const { href, locale } = splitLocale(next)
      router.replace(href, { locale })
    },
  )

  // Coming from the form (it had a link): the focus goes to the message, or it would be lost.
  if (expired) return <ExpiredLink next={next} takeFocus={hasLink} />

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-3.5">
      <FormAlert message={alert} />
      <AuthField
        id={`${ids}-password`}
        label={t('reset.label')}
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
        {pending ? t('reset.pending') : t('reset.submit')}
      </Button>
    </form>
  )
}

/** The link no longer works (PR-08): says so, and asks for a new one from the log in page. */
function ExpiredLink({ next, takeFocus }: { next: string; takeFocus: boolean }) {
  const t = useTranslations('auth.reset')
  const message = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    if (takeFocus) message.current?.focus()
  }, [takeFocus])

  return (
    <div className="flex flex-col gap-3.5">
      {/* Focused when it replaces the form, so it is read once: no alert role on top. No
          outline: only the code focuses it. */}
      <p ref={message} tabIndex={-1} className="type-ui outline-none">
        {t('expired')}
      </p>
      <Link
        href={{ pathname: '/login', query: { mode: 'recover', next } }}
        className="flex h-11 tap items-center justify-center rounded-full bg-primary type-ui font-semibold text-primary-foreground"
      >
        {t('requestNew')}
      </Link>
    </div>
  )
}
