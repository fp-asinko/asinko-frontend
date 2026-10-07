import { useFormatter, useTranslations } from 'next-intl'
import { UserAvatar } from '@/components/molecules/user-avatar'
import type { Person } from '../interests.types'
import { CommunityLink } from './community-link'

/** People I follow, as @handle, each a link to the profile (specs/community-pages CP-21). */
export function PeopleList({ people }: { people: Person[] }) {
  const t = useTranslations('interests')
  const format = useFormatter()

  return (
    <ul className="flex flex-col gap-0.5">
      {people.map((person) => (
        <li key={person.id}>
          <CommunityLink
            href={person.path}
            className="group flex min-h-9 tap items-center gap-2 rounded-md p-1 transition-colors duration-150 ease-out outline-none hover:bg-surface focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current=page]:bg-muted"
          >
            <UserAvatar
              name={person.username}
              imageUrl={person.avatarUrl}
              size="sm"
              className="transition-[scale] duration-200 ease-out group-hover:scale-105"
            />
            <span className="min-w-0 flex-1 truncate type-small font-semibold">
              {person.handle}
            </span>
            {person.accuracyRate !== null && (
              <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[0.625rem] font-bold tabular-nums">
                <span aria-hidden>{format.number(person.accuracyRate, { style: 'percent' })}</span>
                <span className="sr-only">
                  {t('accuracy', {
                    value: format.number(person.accuracyRate, { style: 'percent' }),
                  })}
                </span>
              </span>
            )}
          </CommunityLink>
        </li>
      ))}
    </ul>
  )
}
