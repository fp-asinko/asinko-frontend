import { useId } from 'react'
import { IdentityBanner } from '@/components/molecules/identity-banner'
import { UserAvatar } from '@/components/molecules/user-avatar'
import { Link } from '@/i18n/navigation'
import { communityPath } from '@/lib/communities/paths'
import { cn } from '@/lib/utils'
import type { Preview } from '../communities.types'
import { CommunityActions } from './community-actions'
import { MemberCount, ProfileStats } from './community-stats'
import { ProfileMarks } from './profile-marks'

/**
 * What a hover card shows (specs/mention-preview MP-03 to MP-06), as Reddit's: banner, avatar,
 * the name (a link to the page), what it is about, its numbers, and Join or Follow (not on your
 * own profile). `summaryId` marks the part a screen reader hears as the link's description: the
 * buttons stay out of it.
 */
export function PreviewCard({ preview, summaryId }: { preview: Preview; summaryId: string }) {
  const { community, profile } = preview
  const titleId = useId()
  const person = community.kind === 'user'
  const title = profile?.displayName ?? community.handle
  const subtitle = profile ? (profile.displayName ? community.handle : null) : community.subtitle
  const description = profile ? profile.bio : community.description

  return (
    <div>
      <IdentityBanner colorKey={community.slug} imageUrl={community.bannerUrl} className="h-16" />
      <div className="px-4 pb-4">
        <div className="flex items-end justify-between gap-3">
          <UserAvatar
            name={community.handle}
            colorKey={community.slug}
            imageUrl={profile?.avatarUrl ?? community.avatarUrl}
            size="xl"
            className={cn(
              'relative -mt-6 size-12 border-3 border-popover text-sm',
              person ? 'rounded-full' : 'rounded-xl',
            )}
          />
          {!profile?.isSelf && (
            <CommunityActions
              slug={community.slug}
              handle={community.handle}
              membership={community.viewerMembership}
              favorite={null}
              variant={person ? 'user' : 'community'}
              // Joined, the focus stays in the card: on its name (and back to the link on closing).
              focusFallbackId={titleId}
            />
          )}
        </div>
        <div id={summaryId} className="mt-2">
          <div className="flex items-center gap-1.5">
            <Link
              id={titleId}
              href={communityPath(community.kind, community.slug)}
              className="min-w-0 truncate type-post-title hover:underline"
            >
              {title}
            </Link>
            {profile && <ProfileMarks profile={profile} />}
          </div>
          {subtitle && <p className="type-meta wrap-anywhere text-muted-foreground">{subtitle}</p>}
          {description && (
            <p className="mt-2 line-clamp-3 type-small wrap-anywhere text-muted-foreground">
              {description}
            </p>
          )}
          {profile ? (
            <ProfileStats profile={profile} className="mt-3" />
          ) : (
            <MemberCount count={community.memberCount} className="mt-3" />
          )}
        </div>
      </div>
    </div>
  )
}
