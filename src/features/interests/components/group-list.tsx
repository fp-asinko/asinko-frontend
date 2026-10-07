import { useTranslations } from 'next-intl'
import { UserAvatar } from '@/components/molecules/user-avatar'
import type { Group } from '../interests.types'
import { CommunityLink } from './community-link'

/**
 * Groups I belong to: #handle, MOD label if I moderate, description below (prototype sizes). The
 * link's name is its content: handle, MOD and description all reach screen readers.
 */
export function GroupList({ groups }: { groups: Group[] }) {
  const t = useTranslations('interests')

  return (
    <ul className="flex flex-col gap-0.5">
      {groups.map((group) => (
        <li key={group.slug}>
          <CommunityLink
            href={group.path}
            className="group flex tap flex-col gap-1 rounded-md px-1 py-1.5 outline-none hover:bg-surface focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current=page]:bg-muted aria-[current=page]:ring-1 aria-[current=page]:ring-foreground"
          >
            <span className="flex items-center gap-2">
              <UserAvatar
                name={group.name}
                colorKey={group.slug}
                imageUrl={group.avatarUrl}
                size="xs"
                className="size-6 rounded-sm transition-[scale] duration-200 ease-out group-hover:scale-105"
              />
              <span className="truncate type-small font-semibold">{group.handle}</span>{' '}
              {group.isModerator && (
                <span className="rounded-sm border border-border-strong px-1 text-[0.5625rem] leading-[0.6875rem] font-extrabold">
                  {t('mod')}
                </span>
              )}
            </span>{' '}
            {group.description && (
              <span className="line-clamp-2 text-[0.6875rem] leading-[0.9375rem] text-muted-foreground">
                {group.description}
              </span>
            )}
          </CommunityLink>
        </li>
      ))}
    </ul>
  )
}
