import { useTranslations } from 'next-intl'
import { UserAvatar } from '@/components/molecules/user-avatar'
import { Link } from '@/i18n/navigation'
import type { Group } from '../interests.types'

/** Groups I belong to: name, MOD label if I moderate, description as subtitle. */
export function GroupList({ groups }: { groups: Group[] }) {
  const t = useTranslations('interests')

  return (
    <ul className="flex flex-col gap-1">
      {groups.map((group) => (
        <li key={group.slug}>
          <Link
            href={{ pathname: '/', query: { comunidad: group.slug } }}
            className="flex gap-2.5 rounded-md px-1 py-1.5 outline-none hover:bg-surface focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <UserAvatar
              name={group.name}
              imageUrl={group.avatarUrl}
              size="sm"
              className="rounded-md"
            />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className="truncate text-ui font-semibold">{group.name}</span>
                {group.isModerator && (
                  <span className="rounded-sm bg-muted px-1 text-[0.625rem] font-bold">
                    {t('mod')}
                  </span>
                )}
              </span>
              {group.description && (
                <span className="line-clamp-2 text-meta text-muted-foreground">
                  {group.description}
                </span>
              )}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
