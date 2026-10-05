'use client'

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
  const { signedIn, openGate } = useAuthGate()
  const t = useTranslations('authGate.header')
  if (signedIn) return children

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
