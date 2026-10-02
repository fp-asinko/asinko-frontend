import type { RawAsset, RawCommunity, RawUserSummary } from '@/lib/api/contract'
import type { AssetTile, Group, Person, Suggestion } from '../interests.types'

const SUGGESTION_COUNT = 3

/** Asset communities the viewer belongs to (one tile each). */
export function memberAssetCommunities(communities: readonly RawCommunity[]) {
  return communities.filter((c) => c.type === 'SYSTEM_ASSET' && c.viewerMembership && c.assetId)
}

export function toAssetTile(asset: RawAsset, communitySlug: string): AssetTile {
  return {
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
    id: user.id,
    username: user.username,
    avatarUrl: user.avatarUrl,
    accuracyRate: user.accuracyRate ?? null,
  }
}

/** Non-asset communities the viewer belongs to, moderated ones first. */
export function toGroups(communities: readonly RawCommunity[]): Group[] {
  return communities
    .filter((c) => c.viewerMembership && c.type !== 'SYSTEM_ASSET' && c.type !== 'PERSONAL_CHANNEL')
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      description: c.description,
      avatarUrl: c.avatarUrl,
      isModerator:
        c.viewerMembership === 'MODERATOR' || c.viewerMembership === 'PRINCIPAL_MODERATOR',
    }))
    .sort((a, b) => Number(b.isModerator) - Number(a.isModerator))
}

/** The biggest communities the viewer is not in yet. */
export function toSuggestions(communities: readonly RawCommunity[]): Suggestion[] {
  return communities
    .filter((c) => !c.viewerMembership && c.type !== 'PERSONAL_CHANNEL')
    .sort((a, b) => b.memberCount - a.memberCount)
    .slice(0, SUGGESTION_COUNT)
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      memberCount: c.memberCount,
      avatarUrl: c.avatarUrl,
    }))
}
