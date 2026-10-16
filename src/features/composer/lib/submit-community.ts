import 'server-only'
import { cache } from 'react'
import { apiRequest, invalidInput, type ApiResult } from '@/lib/api'
import { assetPageSchema, communitySchema, type RawCommunity } from '@/lib/api/contract'
import { assetSymbolSchema } from '@/lib/communities/asset-symbol.schema'
import { communitySlugSchema } from '@/lib/communities/community-slug.schema'
import { kindOf } from '@/lib/communities/paths'
import { allowedImageUrl } from '@/lib/images'
import type { SubmitCommunity } from '../composer.types'
import { toOption } from './composer-api'

const ENDPOINT = 'GET /api/v1/communities/:slug'

/** The asset's own name and class, for the card of an asset community (Q3). Secondary. */
async function assetOf(community: RawCommunity) {
  if (community.type !== 'SYSTEM_ASSET') return null
  const asset = await apiRequest({
    method: 'GET',
    path: '/api/v1/assets/:symbol',
    params: { symbol: community.slug },
    schema: assetPageSchema,
  })
  return asset.ok ? { name: asset.data.name, assetClass: asset.data.assetClass } : null
}

/**
 * The community of the page to create a post (specs/submit-page SU-03, SU-07): the picker's option
 * and what its card shows, as a DTO with only that. The slug comes from the URL: checked before the
 * network. Cached per request: the page and its right column ask for the same one.
 */
export const getSubmitCommunity = cache(async function getSubmitCommunity(
  slug: string,
  viewerName: string | null,
): Promise<ApiResult<SubmitCommunity>> {
  if (!communitySlugSchema.or(assetSymbolSchema).safeParse(slug).success) {
    return invalidInput(ENDPOINT)
  }
  const result = await apiRequest({
    method: 'GET',
    path: '/api/v1/communities/:slug',
    params: { slug },
    schema: communitySchema,
  })
  if (!result.ok) return result
  const community = result.data
  const kind = kindOf(community.type)
  // A personal channel only takes its owner's posts (403 PERSONAL_CHANNEL_OWNER_ONLY).
  const own = kind === 'user' && community.slug === viewerName
  const bareName = community.name.replace(/^[#$@]/, '')
  const asset = await assetOf(community)
  return {
    ok: true,
    data: {
      option: toOption(community, own),
      kind,
      postable: kind !== 'user' || own,
      subtitle:
        asset?.name ??
        (bareName.toLowerCase() === community.slug.toLowerCase() ? null : community.name),
      assetClass: asset?.assetClass ?? null,
      description: community.description?.trim() || null,
      avatarUrl: allowedImageUrl(community.avatarUrl),
      bannerUrl: allowedImageUrl(community.bannerUrl),
      memberCount: community.memberCount,
      createdAt: community.createdByProfileId ? community.createdAt : null,
      rules: community.rules?.trim() || null,
    },
  }
})
