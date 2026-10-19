// By its path: the column's index also brings "Recently viewed", which only the Home has (seo.md).
import { RightColumn } from '@/components/organisms/right-column/right-column'
// By their paths: the groups' and assets' pages, which use the feature's index, do not need them.
import { ProfileCard } from '@/features/communities/components/profile-card'
import { getActiveCommunities } from '@/features/communities/lib/active-communities-api'
import { getProfileDetails } from '@/features/communities/lib/profile-api'

// The right column of a person's achievements (specs/profile-achievements AC-06): their card,
// without the achievements' one, which would lead to this same page.
export default async function AchievementsRight({
  params,
}: PageProps<'/[locale]/user/[username]/achievements'>) {
  const { username } = await params
  const result = await getProfileDetails(decodeURIComponent(username))
  if (!result.ok) return <RightColumn />
  const communities = await getActiveCommunities(result.data.id)
  return (
    <RightColumn>
      <ProfileCard
        profile={result.data}
        communities={communities}
        idPrefix="profile-card-aside"
        className="m-3.5 mb-0"
      />
    </RightColumn>
  )
}
