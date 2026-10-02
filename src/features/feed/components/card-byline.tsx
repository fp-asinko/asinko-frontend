import { useFormatter, useNow, useTranslations } from 'next-intl'
import { UserAvatar } from '@/components/molecules/user-avatar'
import { Link } from '@/i18n/navigation'
import type { Author, CommunityRef } from '../feed.types'

/**
 * Byline of a card as in the prototype: avatar 20px · name (12/700) · accuracy · community · time.
 * A system item shows "Asinko" without accuracy. Users have no link until profiles exist (Q4).
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

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-1.25 gap-y-0.5 type-meta text-muted-foreground">
      <UserAvatar name={author?.username ?? t('system')} imageUrl={author?.avatarUrl} size="xs" />
      <span className="font-bold">{author ? author.handle : t('system')}</span>
      {author?.accuracyRate != null && (
        <span className="rounded-sm bg-muted px-1 text-[0.625rem] font-bold text-foreground tabular-nums">
          <span aria-hidden>{format.number(author.accuracyRate, { style: 'percent' })}</span>
          <span className="sr-only">
            {t('accuracy', { value: format.number(author.accuracyRate, { style: 'percent' }) })}
          </span>
        </span>
      )}
      {community && (
        <>
          <span aria-hidden>·</span>
          <Link
            href={{ pathname: '/', query: { comunidad: community.slug } }}
            className="font-semibold text-foreground hover:underline"
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
