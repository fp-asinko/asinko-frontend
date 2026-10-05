'use client'

import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuthGate } from './auth-gate'

const PILL = 'h-9 rounded-full px-4 type-action'

/**
 * "Log in" and "Sign up" in the top bar without a session (G-02); with one, what it already showed
 * (the profile). On phones only "Log in" fits next to the other controls at 360px.
 */
export function AccountButtons({ children }: { children: ReactNode }) {
  const { signedIn, openGate } = useAuthGate()
  const t = useTranslations('authGate.header')
  if (signedIn) return children

  return (
    <span className="flex items-center gap-1">
      <Button variant="ghost" size="lg" className={PILL} onClick={() => openGate('login')}>
        {t('login')}
      </Button>
      <Button
        size="lg"
        className={cn(PILL, 'hidden md:inline-flex')}
        onClick={() => openGate('signup')}
      >
        {t('signup')}
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
      <Button variant="outline" size="lg" className={PILL} onClick={() => openGate('login')}>
        {t('login')}
      </Button>
    </span>
  )
}
