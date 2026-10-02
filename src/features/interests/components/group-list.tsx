import { useTranslations } from 'next-intl'
import { UserAvatar } from '@/components/molecules/user-avatar'
import { Link } from '@/i18n/navigation'
import type { Group } from '../interests.types'

/** Groups I belong to: #handle, MOD label if I moderate, description below (prototype sizes). */
export function GroupList({ groups }: { groups: Group[] }) {
  const t = useTranslations('interests')

  return (
    <ul className="flex flex-col gap-0.5">
      {groups.map((group) => (
        <li key={group.slug}>
          <Link
            href={{ pathname: '/', query: { community: group.slug } }}
            aria-label={`${group.handle} · ${group.name}`}
            className="flex flex-col gap-1 rounded-md px-1 py-1.5 outline-none hover:bg-surface focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <span className="flex items-center gap-2">
              <UserAvatar
                name={group.name}
                imageUrl={group.avatarUrl}
                size="xs"
                className="size-6 rounded-[5px]"
              />
              <span className="truncate text-[0.8125rem] font-semibold">{group.handle}</span>
              {group.isModerator && (
                <span className="rounded-sm border border-border-strong px-1 text-[0.5625rem] leading-[0.6875rem] font-extrabold">
                  {t('mod')}
                </span>
              )}
            </span>
            {group.description && (
              <span className="line-clamp-2 text-[0.6875rem] leading-[0.9375rem] text-muted-foreground">
                {group.description}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  )
}
