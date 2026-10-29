'use client'

import { MailIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuthGate } from './auth-gate'

// 44px on phones (the main action of the bar), 36px from md. Loose text classes, not type-*:
// cn does not merge those with the Button base (design-system.md § Tipografía).
const PILL = 'h-11 rounded-full px-3 text-[0.8125rem] font-semibold md:h-9 md:px-4'

/**
 * "Sign up" (gray pill) and "Log in" (main pill) in the top bar without a session, like Reddit
 * (G-02, HR-02); with one, what it already showed. On phones only "Log in" fits at 360px: Sign up
 * moves into "⋯" (HR-04).
 */
export function AccountButtons({ children }: { children: ReactNode }) {
  const { signedIn, needsProfile, openGate } = useAuthGate()
  const t = useTranslations('authGate.header')
  if (signedIn) return children
  // Signed in without a username: the one thing left to do (specs/auth AU-11).
  if (needsProfile) {
    return (
      <Button size="lg" className={PILL} onClick={() => openGate('post')}>
        {t('chooseUsername')}
      </Button>
    )
  }

  return (
    <span className="flex items-center gap-2">
      <Button
        variant="secondary"
        size="lg"
        className={cn(PILL, 'hidden md:inline-flex')}
        onClick={() => openGate('signup')}
      >
        {t('signup')}
      </Button>
      <Button size="lg" className={PILL} onClick={() => openGate('login')}>
        {t('login')}
      </Button>
    </span>
  )
}

/** Only with a session: without one, nothing (the bars' "Create", PO 2026-10-21). */
export function SignedInOnly({ children }: { children: ReactNode }) {
  const { signedIn } = useAuthGate()
  return signedIn ? children : null
}

/** "Continue with email" in the Join card: the account modal's sign up form (specs/auth AU-01). */
export function EmailSignUpButton() {
  const { openGate } = useAuthGate()
  const t = useTranslations('authGate.joinCard')
  return (
    <button
      type="button"
      onClick={() => openGate('signup')}
      className="flex h-11 w-full tap items-center justify-center gap-2.5 rounded-full border bg-background type-ui font-semibold hover:bg-muted"
    >
      <MailIcon aria-hidden className="size-4.5 shrink-0" />
      {t('email')}
    </button>
  )
}

/** "Create account" and "Log in", side by side: the Join card and the Following empty state. */
export function GateButtons({ className }: { className?: string }) {
  const { openGate } = useAuthGate()
  const t = useTranslations('authGate')

  return (
    <span className={cn('flex flex-wrap gap-2', className)}>
      <Button size="lg" className={PILL} onClick={() => openGate('signup')}>
        {t('signup')}
      </Button>
      <Button variant="secondary" size="lg" className={PILL} onClick={() => openGate('login')}>
        {t('login')}
      </Button>
    </span>
  )
}
