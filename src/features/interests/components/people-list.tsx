import { useFormatter, useTranslations } from 'next-intl'
import { UserAvatar } from '@/components/molecules/user-avatar'
import type { Person } from '../interests.types'

/** People I follow. No link yet: profiles arrive in phase 2 (Q4). */
export function PeopleList({ people }: { people: Person[] }) {
  const t = useTranslations('interests')
  const format = useFormatter()

  return (
    <ul className="flex flex-col">
      {people.map((person) => (
        <li key={person.id} className="flex min-h-10 items-center gap-2.5 px-1">
          <UserAvatar name={person.username} imageUrl={person.avatarUrl} size="sm" />
          <span className="min-w-0 flex-1 truncate text-ui font-semibold">{person.username}</span>
          {person.accuracyRate !== null && (
            <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[0.6875rem] font-bold tabular-nums">
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
