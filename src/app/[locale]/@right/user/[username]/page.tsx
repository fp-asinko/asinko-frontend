// By its path: the column's index also brings "Recently viewed", which only the Home has (seo.md).
import { RightColumn } from '@/components/organisms/right-column/right-column'
// By their paths: the groups' and assets' pages, which use the feature's index, do not need them.
import { AchievementsCard } from '@/features/communities/components/achievements-card'
import { ProfileCard } from '@/features/communities/components/profile-card'
import { getAchievements } from '@/features/communities/lib/achievements-api'
import { getActiveCommunities } from '@/features/communities/lib/active-communities-api'
import { communityPath } from '@/lib/communities/paths'
import { getProfileDetails } from '@/features/communities/lib/profile-api'

// The right column of a profile, as Reddit's (specs/profile-aside PA-01): the person's card and the
// footer ("Recently viewed" is the Home's, specs/community-widgets CW-02). The page asks the same profile and
// the same communities in this request: they come once (React's cache). A profile that does not
// exist is the page's 404: here, the usual column.
export default async function ProfileRight({ params }: PageProps<'/[locale]/user/[username]'>) {
  const { username } = await params
  const result = await getProfileDetails(decodeURIComponent(username))
  if (!result.ok) return <RightColumn />
  const profile = result.data
  const [communities, achievements] = await Promise.all([
    getActiveCommunities(profile.id),
    // Their trophy case (specs/profile-achievements AC-03), under the card.
    getAchievements(profile.id, profile.isSelf),
  ])
  return (
    <RightColumn>
      <ProfileCard
        profile={profile}
        communities={communities}
        idPrefix="profile-card-aside"
        className="m-3.5 mb-0"
      >
        <AchievementsCard
          achievements={achievements}
          isSelf={profile.isSelf}
          name={profile.displayName ?? `@${profile.username}`}
          achievementsPath={`${communityPath('user', profile.username)}/achievements`}
          idPrefix="achievements-aside"
        />
      </ProfileCard>
    </RightColumn>
  )
}
