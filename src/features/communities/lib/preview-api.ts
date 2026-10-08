import 'server-only'
import type { ApiResult } from '@/lib/api'
import type { PreviewTarget } from '@/lib/communities/preview'
import type { Preview } from '../communities.types'
import { getCommunityPage } from './community-api'
import { getProfileDetails } from './profile-api'

/**
 * What a hover card shows (specs/mention-preview § 3): the same community its page uses, and for a
 * person also the profile, both at once. Only the fields the card renders travel to the browser
 * (security.md § 4). Never throws: a failure means no card.
 */
export async function getPreviewData({ kind, slug }: PreviewTarget): Promise<ApiResult<Preview>> {
  const [community, profile] = await Promise.all([
    getCommunityPage(slug),
    kind === 'user' ? getProfileDetails(slug) : null,
  ])
  if (!community.ok) return community
  if (profile && !profile.ok) return profile
  const page = community.data
  return {
    ok: true,
    data: {
      community: {
        slug: page.slug,
        handle: page.handle,
        subtitle: page.subtitle,
        description: page.description,
        avatarUrl: page.avatarUrl,
        bannerUrl: page.bannerUrl,
        kind: page.kind,
        memberCount: page.memberCount,
        viewerMembership: page.viewerMembership,
      },
      // A personal channel asked as a group (an old link) still shows as a community.
      profile: profile && page.kind === 'user' ? profile.data : null,
    },
  }
}
