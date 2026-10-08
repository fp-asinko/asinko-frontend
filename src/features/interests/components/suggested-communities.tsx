import { useTranslations } from 'next-intl'
import { UserAvatar } from '@/components/molecules/user-avatar'
import { HideWhenJoined, JoinButton } from '@/components/organisms/join'
import { joinCommunity } from '@/lib/communities/join-community.action'
import type { Suggestion } from '../interests.types'
import { CommunityLink } from './community-link'

/**
 * Communities to join (specs/community-first CF-10): the same join as the cards. A joined row
 * hides at once, and the refresh moves the community to Groups. Under the name, what it is about
 * (specs/interests-refresh IR-02): its main post, else its description, else its members. The
 * link's name is its content.
 */
export function SuggestedCommunities({ suggestions }: { suggestions: Suggestion[] }) {
  const t = useTranslations('interests')

  return (
    <ul className="flex flex-col">
      {suggestions.map((suggestion) => (
        <HideWhenJoined key={suggestion.slug} slug={suggestion.slug}>
          <li className="flex items-center gap-2 rounded-md px-0.5 py-1.5">
            <CommunityLink
              href={suggestion.path}
              className="group -mx-1 flex min-w-0 flex-1 tap items-center gap-2 rounded-md px-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current=page]:bg-muted"
            >
              <UserAvatar
                name={suggestion.name}
                colorKey={suggestion.slug}
                imageUrl={suggestion.avatarUrl}
                size="md"
                className="size-8 rounded-md transition-[scale] duration-200 ease-out group-hover:scale-105"
              />
              <span className="min-w-0">
                <span className="block truncate type-small font-bold">{suggestion.handle}</span>{' '}
                <span className="block truncate type-meta text-muted-foreground">
                  {suggestion.topPostTitle ??
                    suggestion.description ??
                    t('members', { count: suggestion.memberCount })}
                </span>
              </span>
            </CommunityLink>
            <JoinButton
              slug={suggestion.slug}
              handle={suggestion.handle}
              action={joinCommunity}
              variant="compact"
            />
          </li>
        </HideWhenJoined>
      ))}
    </ul>
  )
}
