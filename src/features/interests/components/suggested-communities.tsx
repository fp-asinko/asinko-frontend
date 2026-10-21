import { useTranslations } from 'next-intl'
import { FitList } from '@/components/molecules/fit-list'
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
    // As many as fit whole in the height left, at least one (specs/sidebar-fill SF-02, SF-04).
    <FitList className="min-h-13">
      {suggestions.map((suggestion) => (
        <HideWhenJoined key={suggestion.slug} slug={suggestion.slug}>
          {/* The whole row is the hover and the current page, Join included (the PO, 2026-10-10). */}
          <li className="group/row flex items-center gap-2 rounded-md px-1 py-1.5 transition-colors duration-150 ease-out hover:bg-surface has-aria-[current=page]:bg-muted">
            <CommunityLink
              href={suggestion.path}
              className="group flex min-w-0 flex-1 tap items-center gap-2 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
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
              // On the gray row of the current page, the gray pill would vanish: white there.
              className="group-has-aria-[current=page]/row:bg-background"
            />
          </li>
        </HideWhenJoined>
      ))}
    </FitList>
  )
}
