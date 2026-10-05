import type { RawAsset, RawCommunity, RawUserSummary } from '@/lib/api/contract'
import type { AssetTile, Group, Person, Suggestion } from '../interests.types'
import { allowedImageUrl } from '@/lib/images'

/** Suggestions under the viewer sections; without a session the list is all the column shows. */
export const SUGGESTION_COUNT = { signedIn: 3, guest: 8 } as const

/** An asset community slug is its symbol in lower case (btc → BTC). */
export function assetSymbol(slug: string) {
  return slug.toUpperCase()
}

/** The mention handle of a community: $ for an asset, # for a group (overview.md § Menciones). */
function communityHandle(community: RawCommunity) {
  return community.type === 'SYSTEM_ASSET'
    ? `$${assetSymbol(community.slug)}`
    : `#${community.slug}`
}

/** Asset communities the viewer belongs to (one tile each). */
export function memberAssetCommunities(communities: readonly RawCommunity[]) {
  return communities.filter((c) => c.type === 'SYSTEM_ASSET' && c.viewerMembership && c.assetId)
}

export function toAssetTile(asset: RawAsset, communitySlug: string): AssetTile {
  return {
    handle: `$${asset.symbol}`,
    symbol: asset.symbol,
    name: asset.name,
    changePct: asset.priceChangePct,
    price: asset.price,
    stale: asset.priceStale,
    communitySlug,
  }
}

export function toPerson(user: RawUserSummary): Person {
  return {
    handle: `@${user.username}`,
    id: user.id,
    username: user.username,
    avatarUrl: allowedImageUrl(user.avatarUrl),
    accuracyRate: user.accuracyRate ?? null,
  }
}

/** Non-asset communities the viewer belongs to, moderated ones first. */
export function toGroups(communities: readonly RawCommunity[]): Group[] {
  return communities
    .filter((c) => c.viewerMembership && c.type !== 'SYSTEM_ASSET' && c.type !== 'PERSONAL_CHANNEL')
    .map((c) => ({
      handle: communityHandle(c),
      slug: c.slug,
      name: c.name,
      description: c.description,
      avatarUrl: allowedImageUrl(c.avatarUrl),
      isModerator:
        c.viewerMembership === 'MODERATOR' || c.viewerMembership === 'PRINCIPAL_MODERATOR',
    }))
    .sort((a, b) => Number(b.isModerator) - Number(a.isModerator))
}

/** The biggest communities the viewer is not in yet. */
export function toSuggestions(
  communities: readonly RawCommunity[],
  count: number = SUGGESTION_COUNT.signedIn,
): Suggestion[] {
  return communities
    .filter((c) => !c.viewerMembership && c.type !== 'PERSONAL_CHANNEL')
    .sort((a, b) => b.memberCount - a.memberCount)
    .slice(0, count)
    .map((c) => ({
      handle: communityHandle(c),
      slug: c.slug,
      name: c.name,
      memberCount: c.memberCount,
      avatarUrl: allowedImageUrl(c.avatarUrl),
    }))
}
