import type { ReactNode } from 'react'
import type { CommunityKind } from '../communities.types'
import { getActiveCommunities } from '../lib/active-communities-api'
import { getAssetSummary } from '../lib/asset-api'
import { getProfileDetails } from '../lib/profile-api'
import { AssetAside } from './asset-aside'
import { ProfileCard } from './profile-card'
import { GroupAside } from './widgets/group-aside'

/**
 * The right column of a post, as Reddit's (specs/community-widgets CW-03): what speaks of where it
 * was published. A group, its details and widgets; an asset, its market data; a personal channel,
 * its person's card. What cannot be asked shows nothing (the column keeps its footer).
 */
export async function PostAside({
  community,
  markdown,
}: {
  community: { kind: CommunityKind; slug: string }
  markdown: (body: string) => ReactNode
}) {
  if (community.kind === 'group') return <GroupAside slug={community.slug} markdown={markdown} />
  if (community.kind === 'asset') {
    const asset = await getAssetSummary(community.slug)
    return asset.ok ? <AssetAside market={asset.data.market} /> : null
  }
  const profile = await getProfileDetails(community.slug)
  if (!profile.ok) return null
  const communities = await getActiveCommunities(profile.data.id)
  return (
    <ProfileCard
      profile={profile.data}
      communities={communities}
      idPrefix="profile-card-aside"
      className="m-3.5 mb-0"
    />
  )
}
