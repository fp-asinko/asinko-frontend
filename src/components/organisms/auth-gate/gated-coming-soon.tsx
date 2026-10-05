'use client'

import type { ReactNode } from 'react'
import { ComingSoon } from '@/components/molecules/coming-soon'
import { cn } from '@/lib/utils'
import { useAuthGate, type GatedAction } from './auth-gate'

/**
 * A feature that is coming soon for everyone, but that needs an account first (G-04): without a
 * session it opens the account modal; with one it stays "Coming soon" (H-26) until its own spec
 * (creating posts, joining communities) replaces it.
 */
export function GatedComingSoon({
  action,
  label,
  className,
  placement,
  children,
}: {
  action: GatedAction
  label: string
  className?: string
  placement?: Parameters<typeof ComingSoon>[0]['placement']
  children: ReactNode
}) {
  const { signedIn, openGate } = useAuthGate()

  if (signedIn) {
    return (
      <ComingSoon label={label} className={className} placement={placement}>
        {children}
      </ComingSoon>
    )
  }
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label={label}
        onClick={() => openGate(action)}
        className={cn('outline-none focus-visible:ring-3 focus-visible:ring-ring/50', className)}
      >
        {children}
      </button>
    </span>
  )
}
