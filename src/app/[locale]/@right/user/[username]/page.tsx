import { RightColumn } from '@/components/organisms/right-column'
// By their paths: the groups' and assets' pages, which use the feature's index, do not need them.
import { ProfileCard } from '@/features/communities/components/profile-card'
import { getActiveCommunities } from '@/features/communities/lib/active-communities-api'
import { getProfileDetails } from '@/features/communities/lib/profile-api'

// The right column of a profile, as Reddit's (specs/profile-aside PA-01): the person's card, then
// "Recently viewed" and the footer, without the season tokens. The page asks the same profile and
// the same communities in this request: they come once (React's cache). A profile that does not
// exist is the page's 404: here, the usual column.
export default async function ProfileRight({ params }: PageProps<'/[locale]/user/[username]'>) {
  const { username } = await params
  const result = await getProfileDetails(decodeURIComponent(username))
  if (!result.ok) return <RightColumn />
  const communities = await getActiveCommunities(result.data.id)
  return (
    <RightColumn
      lead={
        <ProfileCard
          profile={result.data}
          communities={communities}
          idPrefix="profile-card-aside"
          className="m-3.5 mb-0"
        />
      }
    />
  )
}
