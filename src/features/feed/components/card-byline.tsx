import { useFormatter, useNow, useTranslations } from 'next-intl'
import { UserAvatar } from '@/components/molecules/user-avatar'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import type { Author, CommunityRef } from '../feed.types'
import { accuracyTier, type AccuracyTier } from '../lib/accuracy-tier'

// FC-03: the chip is tinted by tier; the percentage stays visible, so color is never the only cue.
const TIER_CLASSES: Record<AccuracyTier, string> = {
  high: 'bg-accuracy-high text-accuracy-high-foreground',
  mid: 'bg-accuracy-mid text-accuracy-mid-foreground',
  low: 'bg-accuracy-low text-accuracy-low-foreground',
}

/**
 * Byline of a card as in the prototype: avatar 20px · name (12/700) · accuracy · community · time.
 * A system item shows "Asinko" without accuracy. Users have no link until profiles exist (Q4).
 * Hovering the byline lifts the avatar and rings the chip (FC-10); without motion only the ring.
 */
export function CardByline({
  author,
  community,
  publishedAt,
  edited = false,
}: {
  author: Author | null
  community: CommunityRef | null
  publishedAt: string
  edited?: boolean
}) {
  const t = useTranslations('feed.card')
  const format = useFormatter()
  const now = useNow()
  const date = new Date(publishedAt)
  const accuracy =
    author?.accuracyRate != null
      ? {
          tier: accuracyTier(author.accuracyRate),
          value: format.number(author.accuracyRate, { style: 'percent' }),
        }
      : null

  return (
    <div className="group/byline flex min-w-0 flex-wrap items-center gap-x-1.25 gap-y-0.5 type-meta text-muted-foreground">
      <UserAvatar
        name={author?.username ?? t('system')}
        imageUrl={author?.avatarUrl}
        size="xs"
        className="transition-[scale] duration-150 ease-out group-hover/byline:scale-110"
      />
      <span className="min-w-0 font-bold break-all">{author ? author.handle : t('system')}</span>
      {accuracy && (
        <span
          data-tier={accuracy.tier}
          className={cn(
            'rounded-sm px-1 text-[0.625rem] font-bold tabular-nums ring-current/0 transition-shadow duration-150 ease-out group-hover/byline:ring-1 group-hover/byline:ring-current/40',
            TIER_CLASSES[accuracy.tier],
          )}
        >
          <span aria-hidden>{accuracy.value}</span>
          <span className="sr-only">{t('accuracy', accuracy)}</span>
        </span>
      )}
      {community && (
        <>
          <span aria-hidden>·</span>
          <Link
            href={{ pathname: '/', query: { community: community.slug } }}
            className="inline-flex min-h-6 min-w-0 items-center font-semibold break-all text-foreground hover:underline"
          >
            {community.handle}
          </Link>
        </>
      )}
      <span aria-hidden>·</span>
      <time dateTime={publishedAt}>{format.relativeTime(date, now)}</time>
      {edited && (
        <>
          <span aria-hidden>·</span>
          <span>{t('edited')}</span>
        </>
      )}
    </div>
  )
}
