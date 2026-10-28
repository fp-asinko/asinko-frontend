'use client'

import { StarIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'
import { useRouter } from '@/i18n/navigation'
import { setFavorite } from '@/lib/communities/set-favorite.action'
import { cn } from '@/lib/utils'

/**
 * Where it sits: beside a row's link (a round button), or in an asset tile's corner, small and with
 * no background so it covers nothing (PO, 2026-10-28). Both at least 24px to tap (WCAG 2.5.8).
 */
const PLACEMENT = {
  row: 'size-7 rounded-full hover:bg-muted [&_svg]:size-3.5',
  // The icon in the very corner, away from the symbol; the 24px to tap around it (PO, 2026-10-28).
  corner: 'absolute top-0 right-0 size-6 items-start! justify-end! rounded-md p-1 [&_svg]:size-2.5',
} as const

/**
 * A favorite star in "Your interests" (specs/favorites FV-01, FV-02), as Reddit's: black and always
 * there on a favorite; empty, only on the row's hover or keyboard focus, on the rest. The row (or
 * the tile) is `group/row`. Shown at once; the column reorders when the page refreshes after it. If
 * it fails, it goes back and says so (FV-04).
 */
export function FavoriteStar({
  slug,
  handle,
  initial,
  placement = 'row',
}: {
  /** The community: a group, an asset's, or a person's channel. */
  slug: string
  /** How it is said: #macro, $BTC, @maria. */
  handle: string
  initial: boolean
  placement?: keyof typeof PLACEMENT
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
          'inline-flex shrink-0 tap items-center justify-center text-muted-foreground outline-none hover:text-foreground focus-visible:opacity-100 focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:cursor-wait',
          PLACEMENT[placement],
          favorite
            ? 'text-foreground'
            : 'opacity-0 group-focus-within/row:opacity-100 group-hover/row:opacity-100',
        )}
      >
        <StarIcon aria-hidden className={cn(favorite && 'fill-current')} />
      </button>
      <span role="alert" className="sr-only">
        {failed ? t('error') : ''}
      </span>
    </>
  )
}
