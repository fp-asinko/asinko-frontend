'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { PlusIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'
import { useRouter } from '@/i18n/navigation'
import type { ActionResult } from '@/lib/result'
import { cn } from '@/lib/utils'
import { useAuthGate } from '../auth-gate'
import { useJoined } from './joined'

const joinVariants = cva(
  'inline-flex shrink-0 tap items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:cursor-wait aria-disabled:active:scale-100',
  {
    variants: {
      variant: {
        // The black pill of Reddit, on the cards (CF-05).
        card: 'h-8 px-3.5 type-action bg-primary text-primary-foreground hover:bg-primary/85',
        // The gray pill of the interests column (CF-10).
        compact: 'h-6 gap-0.5 bg-muted px-2 text-[0.625rem] hover:bg-muted-hover',
      },
    },
    defaultVariants: { variant: 'card' },
  },
)

/**
 * Join a community (specs/community-first § 3.2). Knows nothing of the business: the Server Action
 * arrives by prop. Without a session it opens the account modal; with one it hides at once in every
 * place (optimistic), runs the action and refreshes the page in the background.
 */
export function JoinButton({
  slug,
  handle,
  action,
  variant,
  label = 'join',
  focusFallbackId,
  className,
}: {
  slug: string
  /** #defi or $BTC: the accessible name says which community. */
  handle: string
  action: (slug: string) => Promise<ActionResult<unknown>>
  /** "Join" a community, or "Follow" a user (joining their personal channel). */
  label?: 'join' | 'follow'
  /** Where the focus goes when the button disappears under it (CF-14): the post title. */
  focusFallbackId?: string
  className?: string
} & VariantProps<typeof joinVariants>) {
  const t = useTranslations('join')
  const joined = useJoined()
  const router = useRouter()
  const { requireAccount, openGate } = useAuthGate()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState(false)

  if (joined.has(slug)) return null

  function join(event: React.MouseEvent<HTMLButtonElement>) {
    if (pending || !requireAccount('join')) return
    if (focusFallbackId && document.activeElement === event.currentTarget) {
      document.getElementById(focusFallbackId)?.focus()
    }
    setError(false)
    joined.mark(slug)
    startTransition(async () => {
      const result = await action(slug)
      if (result.ok) {
        // In the background: the column moves the community to Groups (CF-07).
        startTransition(() => router.refresh())
        return
      }
      joined.unmark(slug)
      if (result.error === 'api.errors.UNAUTHENTICATED') openGate('join')
      else setError(true)
    })
  }

  return (
    <span className="relative inline-flex shrink-0">
      <button
        type="button"
        // aria-disabled, not disabled, while saving: the focus stays (WCAG 2.4.3).
        aria-disabled={pending || undefined}
        onClick={join}
        className={cn(joinVariants({ variant }), className)}
      >
        {variant === 'compact' && <PlusIcon aria-hidden className="size-2.5" />}
        <span aria-hidden>{t(label === 'follow' ? 'follow' : 'label')}</span>
        <span className="sr-only">
          {t(label === 'follow' ? 'followFor' : 'labelFor', { handle })}
        </span>
      </button>
      {error && (
        <span
          role="alert"
          className="absolute top-full right-0 z-10 mt-1 rounded-md bg-background px-1.5 py-0.5 type-meta whitespace-nowrap text-destructive"
        >
          {t('error')}
        </span>
      )}
    </span>
  )
}
