import type { ReactNode } from 'react'
import { useFormatter, useNow, useTranslations } from 'next-intl'
import { UserAvatar } from '@/components/molecules/user-avatar'
import { JoinButton } from '@/components/organisms/join'
import { Link } from '@/i18n/navigation'
import { joinCommunity } from '@/lib/communities/join-community.action'
import { cn } from '@/lib/utils'
import type { Author, CardCommunity } from '../feed.types'
import { accuracyTier, type AccuracyTier } from '../lib/accuracy-tier'

// FC-03: the chip is tinted by tier; the percentage stays visible, so color is never the only cue.
const TIER_CLASSES: Record<AccuracyTier, string> = {
  high: 'bg-accuracy-high text-accuracy-high-foreground',
  mid: 'bg-accuracy-mid text-accuracy-mid-foreground',
  low: 'bg-accuracy-low text-accuracy-low-foreground',
}

/**
 * Header of a card, the group first as on Reddit (specs/community-first § 1):
 *
 *   [AC] #acciones · 13 h ago        (Join)
 *        @jeppe 85 %
 *
 * A post in a user's personal channel has no group: one line with the author's photo. A system
 * item shows "Asinko". Users have no link until profiles exist (Q4). Hovering the header lifts the
 * avatar and rings the chip (FC-10); without motion only the ring.
 */
export function CardByline({
  author,
  community,
  publishedAt,
  titleId,
  edited = false,
  canJoin = true,
  badge,
}: {
  author: Author | null
  community: CardCommunity | null
  publishedAt: string
  /** The card title: the focus goes there when the join button disappears (CF-14). */
  titleId: string
  edited?: boolean
  /** false for a deleted card (CF-05). */
  canJoin?: boolean
  /** Shown before the join button: the POLL badge. */
  badge?: ReactNode
}) {
  const t = useTranslations('feed.card')
  const format = useFormatter()
  const now = useNow()
  const group = community && !community.personal ? community : null
  const authorName = author ? author.handle : t('system')
  const accuracy =
    author?.accuracyRate != null
      ? {
          tier: accuracyTier(author.accuracyRate),
          value: format.number(author.accuracyRate, { style: 'percent' }),
        }
      : null

  const chip = accuracy && (
    <span
      data-tier={accuracy.tier}
      className={cn(
        'shrink-0 rounded-sm px-1 text-[0.625rem] font-bold tabular-nums ring-1 ring-current/0 transition-shadow duration-150 ease-out group-hover/byline:ring-current/40',
        TIER_CLASSES[accuracy.tier],
      )}
    >
      <span aria-hidden>{accuracy.value}</span>
      <span className="sr-only">{t('accuracy', accuracy)}</span>
    </span>
  )

  return (
    <div className="group/byline flex min-w-0 items-start gap-2">
      <UserAvatar
        name={group ? group.handle : authorName}
        colorKey={group ? group.slug : authorName}
        imageUrl={group ? group.avatarUrl : author?.avatarUrl}
        className={cn(
          'size-6 text-[0.5625rem] transition-[scale] duration-150 ease-out motion-safe:group-hover/byline:scale-105',
          group && 'rounded-md',
        )}
      />
      <div className="min-w-0 flex-1">
        <div className="flex min-h-6 min-w-0 items-center gap-x-1.25 type-meta text-muted-foreground">
          {group ? (
            <Link
              href={{ pathname: '/', query: { community: group.slug } }}
              className="inline-flex min-h-6 min-w-0 items-center truncate type-small font-bold text-foreground hover:underline"
            >
              {group.handle}
            </Link>
          ) : (
            <>
              <span className="min-w-0 truncate font-bold text-foreground">{authorName}</span>
              {chip}
            </>
          )}
          <span aria-hidden>·</span>
          <time dateTime={publishedAt} className="shrink-0 whitespace-nowrap">
            {format.relativeTime(new Date(publishedAt), now)}
          </time>
          {edited && (
            <>
              <span aria-hidden>·</span>
              <span className="shrink-0">{t('edited')}</span>
            </>
          )}
        </div>
        {group && (
          // CF-02: the author in second place, smaller and without a photo.
          <div className="flex min-w-0 items-center gap-x-1.25 type-meta text-muted-foreground">
            <span className="min-w-0 truncate">{authorName}</span>
            {chip}
          </div>
        )}
      </div>
      {badge}
      {group && canJoin && group.viewerIsMember !== true && (
        <JoinButton
          slug={group.slug}
          handle={group.handle}
          action={joinCommunity}
          focusFallbackId={titleId}
        />
      )}
    </div>
  )
}
