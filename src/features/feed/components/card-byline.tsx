import type { ReactNode } from 'react'
import { useFormatter, useNow, useTranslations } from 'next-intl'
import { UserAvatar } from '@/components/molecules/user-avatar'
import { JoinButton } from '@/components/organisms/join'
import { Link } from '@/i18n/navigation'
import { joinCommunity } from '@/lib/communities/join-community.action'
import { previewProps } from '@/lib/communities/preview'
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
    <div className="group/byline flex min-w-0 items-center gap-2">
      <UserAvatar
        name={group ? group.handle : authorName}
        colorKey={group ? group.slug : authorName}
        imageUrl={group ? group.avatarUrl : author?.avatarUrl}
        className={cn(
          // With the first line, not centered on both (the header is centered for the right side).
          'size-6 self-start text-[0.5625rem] transition-[scale] duration-150 ease-out motion-safe:group-hover/byline:scale-105',
          group && 'rounded-md',
        )}
      />
      <div className="min-w-0 flex-1">
        <div className="flex min-h-6 min-w-0 items-center gap-x-1.25 type-meta text-muted-foreground">
          {group ? (
            <Link
              href={group.path}
              // Its hover card (specs/mention-preview MP-01).
              {...previewProps(group.kind, group.slug)}
              className="inline-flex min-h-6 min-w-0 items-center type-ui font-bold text-foreground hover:underline"
            >
              {/* The symbol (# or $) in gray: the name is the protagonist. Both inside one span: as
                  two flex items the browser would name the link "# crypto", with a space. */}
              <span className="truncate">
                <span className="font-normal text-muted-foreground">
                  {group.handle.slice(0, 1)}
                </span>
                {group.handle.slice(1)}
              </span>
            </Link>
          ) : (
            <>
              <AuthorName
                author={author}
                fallback={authorName}
                className="font-bold text-foreground"
              />
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
          // CF-02: the author in second place, smaller (11px) and without a photo.
          <div className="flex min-w-0 items-center gap-x-1.25 text-[0.6875rem] leading-4 text-muted-foreground">
            <AuthorName author={author} fallback={authorName} />
            {chip}
          </div>
        )}
      </div>
      {/* Badge and join in one block, centered on the header: join always on the right edge. */}
      <div className="flex shrink-0 items-center gap-3">
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
    </div>
  )
}

/** The author's @handle, a link to the profile; a system item ("Asinko") has none. */
function AuthorName({
  author,
  fallback,
  className,
}: {
  author: Author | null
  fallback: string
  className?: string
}) {
  if (!author) return <span className={cn('min-w-0 truncate', className)}>{fallback}</span>
  return (
    // pb-2 -mb-2: a 24px target (WCAG 2.5.8) on a 16px line, without moving it. Only downwards,
    // over the header's bottom margin: upwards it would overlap the group's link (axe).
    <Link
      href={author.path}
      {...previewProps('user', author.username)}
      className={cn('-mb-2 inline-block min-w-0 truncate pb-2 hover:underline', className)}
    >
      {author.handle}
    </Link>
  )
}
