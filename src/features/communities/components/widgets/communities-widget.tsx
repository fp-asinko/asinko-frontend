import { useTranslations } from 'next-intl'
import { UserAvatar } from '@/components/molecules/user-avatar'
import { JoinButton } from '@/components/organisms/join'
import { Link } from '@/i18n/navigation'
import { joinCommunity } from '@/lib/communities/join-community.action'
import type { CommunityWidget } from '../../communities.types'

type Of<T extends CommunityWidget['type']> = Extract<CommunityWidget, { type: T }>

/** A list of communities (CW-06): avatar, handle, members and "Join", as the suggestions. */
export function CommunitiesWidgetBody({ widget }: { widget: Of<'COMMUNITIES'> }) {
  const t = useTranslations('communities.widgets')
  return (
    <ul className="flex flex-col gap-1">
      {widget.communities.map((community) => (
        <li key={community.id} className="flex items-center gap-2">
          <Link
            href={community.path}
            className="flex min-h-11 min-w-0 flex-1 items-center gap-2.5 rounded-lg px-1 outline-none hover:bg-surface focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <UserAvatar
              name={community.handle}
              colorKey={community.slug}
              imageUrl={community.avatarUrl}
              size="md"
              className={community.kind === 'user' ? undefined : 'rounded-md'}
            />
            <span className="min-w-0">
              <span className="block truncate type-small font-bold">{community.handle}</span>{' '}
              <span className="block truncate type-meta text-muted-foreground">
                {t('about.members', { count: community.memberCount })}
              </span>
            </span>
          </Link>
          {community.viewerIsMember !== true && community.kind !== 'user' && (
            <JoinButton
              slug={community.slug}
              handle={community.handle}
              action={joinCommunity}
              variant="compact"
            />
          )}
        </li>
      ))}
    </ul>
  )
}
