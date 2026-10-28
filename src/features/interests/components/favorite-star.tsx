'use client'

import { StarIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'
import { useRouter } from '@/i18n/navigation'
import { setFavorite } from '@/lib/communities/set-favorite.action'
import { cn } from '@/lib/utils'

/**
 * A row's favorite star in "Your interests" (specs/favorites FV-01, FV-02), as Reddit's: black and
 * always there on a favorite; empty, only on the row's hover or keyboard focus, on the rest. The
 * row is `group/row`. Shown at once; the column reorders when the page refreshes after it. If it
 * fails, it goes back and says so (FV-04).
 */
export function FavoriteStar({
  slug,
  handle,
  initial,
  className,
}: {
  /** The community: a group, an asset's, or a person's channel. */
  slug: string
  /** How it is said: #macro, $BTC, @maria. */
  handle: string
  initial: boolean
  className?: string
}) {
  const t = useTranslations('communities.actions')
  const router = useRouter()
  const [favorite, setFavoriteState] = useState(initial)
  const [failed, setFailed] = useState(false)
  const [pending, startTransition] = useTransition()

  function toggle() {
    if (pending) return
    const next = !favorite
    setFailed(false)
    setFavoriteState(next)
    startTransition(async () => {
      const result = await setFavorite({ slug, favorite: next })
      if (result.ok) {
        startTransition(() => router.refresh())
        return
      }
      setFavoriteState(!next)
      setFailed(true)
    })
  }

  return (
    <>
      <button
        type="button"
        aria-pressed={favorite}
        aria-disabled={pending || undefined}
        aria-label={t(favorite ? 'favoriteRemove' : 'favoriteAdd', { handle })}
        onClick={toggle}
        className={cn(
          'inline-flex size-7 shrink-0 tap items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:opacity-100 focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:cursor-wait',
          favorite
            ? 'text-foreground'
            : 'opacity-0 group-focus-within/row:opacity-100 group-hover/row:opacity-100',
          className,
        )}
      >
        <StarIcon aria-hidden className={cn('size-3.5', favorite && 'fill-current')} />
      </button>
      <span role="alert" className="sr-only">
        {failed ? t('error') : ''}
      </span>
    </>
  )
}
