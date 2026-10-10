import { useFormatter, useTranslations } from 'next-intl'
import { UserAvatar } from '@/components/molecules/user-avatar'
import { Link } from '@/i18n/navigation'
import { ACCURACY_CLASSES, accuracyTier } from '@/lib/accuracy-tier'
import { cn } from '@/lib/utils'
import type { FollowItem, PeopleList } from '../communities.types'
import { CommunityActions } from './community-actions'

/**
 * A person in a followers or following list (specs/follow-lists FL-02, FL-05): avatar, @handle
 * (to their page) and accuracy in its tier's color, as the left column; on the right, Follow or
 * Following, as on their profile. No button for yourself, nor when it is unknown whether you
 * follow them (P-017 not there yet, or no session). A community's members use it too, without
 * accuracy (specs/community-members CM-02).
 */
export function FollowRow({ person, list }: { person: FollowItem; list: PeopleList }) {
  const t = useTranslations('communities.follows')
  const format = useFormatter()
  const handle = `@${person.username}`
  // Where the focus goes when Follow turns into Following under it (as the cards, CF-14).
  const linkId = `follow-${list}-${person.username}`
  const accuracy =
    person.accuracyRate === null ? null : format.number(person.accuracyRate, { style: 'percent' })
  return (
    <div className="flex min-h-14 items-center gap-3 px-4 py-2">
      <Link
        id={linkId}
        href={person.path}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <UserAvatar
          name={person.username}
          imageUrl={person.avatarUrl}
          size="md"
          className="size-10"
        />
        <span className="min-w-0 truncate type-ui font-bold">{handle}</span>{' '}
        {person.accuracyRate !== null && (
          <span
            data-tier={accuracyTier(person.accuracyRate)}
            className={cn(
              'shrink-0 rounded-sm px-1.5 type-meta font-bold',
              ACCURACY_CLASSES[accuracyTier(person.accuracyRate)],
            )}
          >
            <span aria-hidden>{accuracy}</span>
            <span className="sr-only">{t('accuracy', { value: accuracy ?? '' })}</span>
          </span>
        )}
      </Link>
      {!person.isSelf && person.followed !== null && (
        <CommunityActions
          slug={person.username}
          handle={handle}
          membership={person.followed ? 'MEMBER' : null}
          favorite={null}
          variant="user"
          focusFallbackId={linkId}
        />
      )}
    </div>
  )
}
