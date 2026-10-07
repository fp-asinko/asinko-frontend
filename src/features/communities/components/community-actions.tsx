'use client'

import { StarIcon } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'
import { useAuthGate } from '@/components/organisms/auth-gate'
import { JoinButton, useJoined } from '@/components/organisms/join'
import { useRouter } from '@/i18n/navigation'
import { joinCommunity } from '@/lib/communities/join-community.action'
import { leaveCommunity } from '@/lib/communities/leave-community.action'
import { setFavorite } from '@/lib/communities/set-favorite.action'
import { cn } from '@/lib/utils'
import type { CommunityPage } from '../communities.types'

// Loaded the first time someone wants to leave: most visits never open it (JS budget, seo.md).
const LeaveDialog = dynamic(() => import('./leave-dialog').then((mod) => mod.LeaveDialog), {
  ssr: false,
})

const PILL =
  'inline-flex h-8 tap items-center gap-1.5 rounded-full px-3.5 type-action outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:cursor-wait'

/**
 * The actions of a community page header (specs/community-pages § 4): Join; once a member,
 * "Joined" (tapping it asks to leave) and the favorite star; a principal moderator cannot leave
 * and is told so. Optimistic, shared with the cards and the column through JoinedProvider, and the
 * page refreshes in the background after each change.
 */
export function CommunityActions({
  slug,
  handle,
  membership,
  favorite,
}: Pick<CommunityPage, 'slug' | 'handle'> & {
  membership: CommunityPage['viewerMembership']
  favorite: boolean
}) {
  const t = useTranslations('communities.actions')
  const joined = useJoined()
  const router = useRouter()
  const { openGate } = useAuthGate()
  const [confirming, setConfirming] = useState(false)
  // Mounted from the first opening on, so closing can animate.
  const [dialogMounted, setDialogMounted] = useState(false)
  const [error, setError] = useState(false)
  const [pending, startTransition] = useTransition()

  const member = joined.has(slug) || (membership !== null && !joined.hasLeft(slug))

  if (membership === 'PRINCIPAL_MODERATOR' && member) {
    return (
      <div className="flex items-center gap-2">
        <FavoriteButton slug={slug} handle={handle} initial={favorite} />
        <span className={cn(PILL, 'bg-muted text-muted-foreground')}>
          {t('principal')}
          <span className="sr-only">. {t('principalHint')}</span>
        </span>
      </div>
    )
  }

  if (!member) {
    return <JoinButton slug={slug} handle={handle} action={joinCommunity} />
  }

  function leave() {
    setConfirming(false)
    setError(false)
    joined.markLeft(slug)
    startTransition(async () => {
      const result = await leaveCommunity(slug)
      if (result.ok) {
        startTransition(() => router.refresh())
        return
      }
      joined.unmark(slug)
      if (result.error === 'api.errors.UNAUTHENTICATED') openGate('join')
      else setError(true)
    })
  }

  return (
    <div className="relative flex items-center gap-2">
      <FavoriteButton slug={slug} handle={handle} initial={favorite} />
      <button
        type="button"
        aria-disabled={pending || undefined}
        aria-haspopup="dialog"
        onClick={() => {
          if (pending) return
          setConfirming(true)
          setDialogMounted(true)
        }}
        className={cn(PILL, 'bg-muted hover:bg-muted-hover')}
      >
        {t('joined')}
        <span className="sr-only">. {t('leaveHint', { handle })}</span>
      </button>
      {dialogMounted && (
        <LeaveDialog
          handle={handle}
          open={confirming}
          onConfirm={leave}
          onClose={() => setConfirming(false)}
        />
      )}
      {error && (
        <span
          role="alert"
          className="absolute top-full right-0 z-10 mt-1 rounded-md bg-background px-1.5 py-0.5 type-meta whitespace-nowrap text-destructive"
        >
          {t('error')}
        </span>
      )}
    </div>
  )
}

/** The favorite star (CP-06): members only (the backend answers 404 NOT_MEMBER otherwise). */
function FavoriteButton({
  slug,
  handle,
  initial,
}: Pick<CommunityPage, 'slug' | 'handle'> & { initial: boolean }) {
  const t = useTranslations('communities.actions')
  const router = useRouter()
  const { requireAccount, openGate } = useAuthGate()
  const [favorite, setFavoriteState] = useState(initial)
  const [error, setError] = useState(false)
  const [pending, startTransition] = useTransition()

  function toggle() {
    if (pending || !requireAccount('join')) return
    const next = !favorite
    setError(false)
    setFavoriteState(next)
    startTransition(async () => {
      const result = await setFavorite({ slug, favorite: next })
      if (result.ok) {
        startTransition(() => router.refresh())
        return
      }
      setFavoriteState(!next)
      if (result.error === 'api.errors.UNAUTHENTICATED') openGate('join')
      else setError(true)
    })
  }

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-pressed={favorite}
        aria-disabled={pending || undefined}
        aria-label={t(favorite ? 'favoriteRemove' : 'favoriteAdd', { handle })}
        onClick={toggle}
        className="inline-flex size-8 tap items-center justify-center rounded-full bg-muted text-muted-foreground outline-none hover:bg-muted-hover hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:cursor-wait aria-pressed:text-foreground"
      >
        <StarIcon aria-hidden className={cn('size-4', favorite && 'fill-current')} />
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
