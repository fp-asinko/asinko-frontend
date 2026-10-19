'use client'

import { XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState, useTransition, type ReactNode } from 'react'
import {
  FeaturedMenuContext,
  type FeaturableKind,
  type FeaturedMenuState,
} from '@/components/organisms/featured'
import { useRouter } from '@/i18n/navigation'
import { setFeatured } from '../actions/featured.action'

const ERRORS = ['limit', 'notOwner', 'gone'] as const

/** A translation key of the action as one of the menu's messages. */
function errorKey(key: string) {
  const name = key.replace(/^featured\.errors\./, '')
  return `errors.${ERRORS.find((each) => each === name) ?? 'general'}` as const
}

/**
 * Your own profile's featured posts and theses (specs/profile-showcase PS-07): gives every "⋯" on
 * the page what is featured and how to change it. After a change the page is rendered again on the
 * server, and what happened is announced; a failure also shows, in a notice at the bottom that
 * stays until closed (WCAG 3.3.1).
 */
export function FeaturedScope({
  featured,
  max,
  children,
}: {
  /** What is featured now, as "post:id" or "thesis:id". */
  featured: readonly string[]
  max: number
  children: ReactNode
}) {
  const t = useTranslations('featured')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  function set(kind: FeaturableKind, id: string, next: boolean) {
    setNotice('')
    setError('')
    startTransition(async () => {
      const result = await setFeatured({ kind, id, featured: next })
      if (!result.ok) {
        setError(t(errorKey(result.error), { max }))
        return
      }
      setNotice(next ? t('added') : t('removed'))
      router.refresh()
    })
  }

  const value: FeaturedMenuState = {
    isFeatured: (kind, id) => featured.includes(`${kind}:${id}`),
    full: featured.length >= max,
    max,
    pending,
    set,
  }
  return (
    <FeaturedMenuContext value={value}>
      {children}
      <p role="status" className="sr-only">
        {notice}
      </p>
      {/* Over the bottom bar in phones; in the corner from md. Bordered, without shadow. */}
      <div
        role="alert"
        className="fixed inset-x-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 empty:hidden md:inset-x-auto md:right-6 md:bottom-6 md:w-80"
      >
        {error && (
          <div className="flex items-start gap-2 rounded-lg border bg-background py-2.5 pr-1.5 pl-3.5 type-small text-destructive">
            <span className="min-w-0 flex-1 pt-1">{error}</span>
            <button
              type="button"
              aria-label={t('close')}
              onClick={() => setError('')}
              className="inline-flex size-9 shrink-0 tap items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <XIcon aria-hidden className="size-4" />
            </button>
          </div>
        )}
      </div>
    </FeaturedMenuContext>
  )
}
