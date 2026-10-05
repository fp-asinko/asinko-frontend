'use client'

import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'
import { cn } from '@/lib/utils'
import { devLogin, devLogout } from '../actions/dev-login.action'

const REASONS = ['credentials', 'unavailable', 'disabled'] as const
type Reason = (typeof REASONS)[number]

const PILL =
  'inline-flex h-9 items-center gap-1.5 rounded-full border border-dashed border-input px-3 text-[0.8125rem] font-semibold outline-none hover:bg-surface focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:cursor-wait aria-disabled:opacity-60'

/**
 * Development only (specs/dev-login): signs in with the test account of asinko-app, or out.
 * Dashed, so it never passes for a product control. The layout renders it only when the login is
 * enabled (never in production).
 */
export function DevLoginButton({ username }: { username: string | null }) {
  const t = useTranslations('devLogin')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<Reason | null>(null)

  function run(action: typeof devLogin | typeof devLogout) {
    if (pending) return
    setError(null)
    startTransition(async () => {
      const result = await action()
      if (!result.ok) {
        setError(REASONS.find((reason) => result.error.endsWith(reason)) ?? 'unavailable')
      }
    })
  }

  return (
    <span className="relative hidden items-center md:inline-flex">
      <button
        type="button"
        aria-disabled={pending || undefined}
        onClick={() => run(username ? devLogout : devLogin)}
        className={PILL}
      >
        {username ? t('logout', { username }) : t('login')}
      </button>
      <span
        role="alert"
        className={cn(
          'absolute top-full right-0 mt-1.5 rounded-md bg-destructive px-2 py-1 type-meta whitespace-nowrap text-white',
          !error && 'sr-only',
        )}
      >
        {error ? t(`errors.${error}`) : ''}
      </span>
    </span>
  )
}
