import { useFormatter, useTranslations } from 'next-intl'
import { UserAvatar } from '@/components/molecules/user-avatar'
import { ACCURACY_CLASSES, accuracyTier } from '@/lib/accuracy-tier'
import { cn } from '@/lib/utils'
import type { Person } from '../interests.types'
import { CommunityLink } from './community-link'
import { FavoriteStar } from './favorite-star'
import { plainHandle } from '@/lib/plain-handle'

/**
 * People I follow, each a link to the profile (specs/community-pages CP-21), in the size of the
 * suggestions (specs/interests-refresh IR-03, IR-04), with the accuracy in its tier's color, as on
 * the feed's cards.
 */
export function PeopleList({ people, id }: { people: Person[]; id?: string }) {
  const t = useTranslations('interests')
  const format = useFormatter()

  return (
    // As many as the column's height takes (specs/sidebar-fill SF-03): 5, 3, 2, at least 1.
    // All of them while the section's "more" is open (specs/sidebar-more).
    <ul
      id={id}
      className="flex flex-col gap-0.5 group-has-data-[more=open]/section:[&>li]:block! column-short:[&>li:nth-child(n+2)]:hidden column-mid:[&>li:nth-child(n+3)]:hidden column-tall:[&>li:nth-child(n+4)]:hidden [&>li:nth-child(n+6)]:hidden"
    >
      {people.map((person) => (
        // Following a person is being a member of their channel: its favorite is theirs (FV-01).
        <li key={person.id} className="group/row flex items-center gap-0.5">
          <CommunityLink
            href={person.path}
            className="group flex min-h-10 min-w-0 flex-1 tap items-center gap-2 rounded-md px-1 py-1 transition-colors duration-150 ease-out outline-none hover:bg-surface focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current=page]:bg-muted"
          >
            <UserAvatar
              name={person.username}
              imageUrl={person.avatarUrl}
              size="md"
              className="size-8 transition-[scale] duration-200 ease-out group-hover:scale-105"
            />
            <span className="min-w-0 flex-1 truncate type-small font-bold">
              {plainHandle(person.handle)}
            </span>
            {person.accuracyRate !== null && (
              <span
                data-tier={accuracyTier(person.accuracyRate)}
                className={cn(
                  'rounded-sm px-1.5 py-0.5 text-[0.625rem] font-bold tabular-nums',
                  ACCURACY_CLASSES[accuracyTier(person.accuracyRate)],
                )}
              >
                <span aria-hidden>{format.number(person.accuracyRate, { style: 'percent' })}</span>
                <span className="sr-only">
                  {t('accuracy', {
                    value: format.number(person.accuracyRate, { style: 'percent' }),
                  })}
                </span>
              </span>
            )}
          </CommunityLink>
          <FavoriteStar
            slug={person.channelSlug}
            handle={person.handle}
            initial={person.favorite}
          />
        </li>
      ))}
    </ul>
  )
}
