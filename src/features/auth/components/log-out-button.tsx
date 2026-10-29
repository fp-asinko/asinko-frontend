'use client'

import { useTranslations } from 'next-intl'
import { useTransition } from 'react'
import { useRouter } from '@/i18n/navigation'
import { logOut } from '../actions/log-out.action'

/** Log out from the username screen (specs/auth AU-11): the way out of choosing one. */
export function LogOutButton() {
  const t = useTranslations('authGate.menu')
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      aria-disabled={pending || undefined}
      onClick={() =>
        startTransition(async () => {
          await logOut()
          // The Home without a session.
          router.replace('/')
        })
      }
      className="mx-auto min-h-11 px-3 type-ui font-semibold text-muted-foreground underline underline-offset-2 hover:text-foreground"
    >
      {t('logOut')}
    </button>
  )
}
