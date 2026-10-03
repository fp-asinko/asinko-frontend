import { useFormatter, useTranslations } from 'next-intl'
import { UserAvatar } from '@/components/molecules/user-avatar'
import type { Person } from '../interests.types'

/** People I follow, as @handle. No link yet: profiles arrive in phase 2 (Q4). */
export function PeopleList({ people }: { people: Person[] }) {
  const t = useTranslations('interests')
  const format = useFormatter()

  return (
    <ul className="flex flex-col gap-0.5">
      {people.map((person) => (
        <li
          key={person.id}
          className="group flex min-h-9 items-center gap-2 rounded-md p-1 transition-colors duration-150 ease-out hover:bg-surface"
        >
          <UserAvatar
            name={person.username}
            imageUrl={person.avatarUrl}
            size="sm"
            className="transition-[scale] duration-200 ease-out group-hover:scale-105"
          />
          <span className="min-w-0 flex-1 truncate type-small font-semibold">{person.handle}</span>
          {person.accuracyRate !== null && (
            <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[0.625rem] font-bold tabular-nums">
              <span aria-hidden>{format.number(person.accuracyRate, { style: 'percent' })}</span>
              <span className="sr-only">
                {t('accuracy', { value: format.number(person.accuracyRate, { style: 'percent' }) })}
              </span>
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}
