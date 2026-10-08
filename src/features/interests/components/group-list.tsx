import { useTranslations } from 'next-intl'
import { UserAvatar } from '@/components/molecules/user-avatar'
import type { Group } from '../interests.types'
import { CommunityLink } from './community-link'

/**
 * Groups I belong to, in the suggestions' row (specs/interests-refresh IR-01, IR-05): avatar and #handle,
 * MOD label if I moderate, and below what is being talked about there (its main post), else its
 * description, else its members. The link's name is its content: handle, MOD and the line below.
 * The current page shows with a gray background, as the people (no outline).
 */
export function GroupList({ groups }: { groups: Group[] }) {
  const t = useTranslations('interests')

  return (
    <ul className="flex flex-col gap-0.5">
      {groups.map((group) => (
        <li key={group.slug}>
          <CommunityLink
            href={group.path}
            className="group flex tap items-center gap-2 rounded-md px-1 py-1.5 outline-none hover:bg-surface focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current=page]:bg-muted"
          >
            <UserAvatar
              name={group.name}
              colorKey={group.slug}
              imageUrl={group.avatarUrl}
              size="md"
              className="size-8 rounded-md transition-[scale] duration-200 ease-out group-hover:scale-105"
            />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className="min-w-0 truncate type-small font-bold">{group.handle}</span>{' '}
                {group.isModerator && (
                  <span className="rounded-sm border border-border-strong px-1 text-[0.5625rem] leading-[0.6875rem] font-extrabold">
                    {t('mod')}
                  </span>
                )}
              </span>{' '}
              <span className="block truncate type-meta text-muted-foreground">
                {group.topPostTitle ??
                  group.description ??
                  t('members', { count: group.memberCount })}
              </span>
            </span>
          </CommunityLink>
        </li>
      ))}
    </ul>
  )
}
