import type { RawAsset, RawCommunity, RawUserSummary } from '@/lib/api/contract'
import type { AssetTile, Group, Person, Suggestion } from '../interests.types'
import { communityPath, kindOf, mentionOf } from '@/lib/communities/paths'
import { allowedImageUrl } from '@/lib/images'

/** Up to 8, with or without a session: Suggested shows the ones that fit (specs/sidebar-fill SF-02). */
export const SUGGESTION_COUNT = { signedIn: 8, guest: 8 } as const

/** A community's mention: an asset's symbol from its name (specs/backend-answer-1020 BA-10). */
const communityHandle = (community: RawCommunity) => mentionOf(community).handle

/** Asset communities the viewer belongs to (one tile each). */
export function memberAssetCommunities(communities: readonly RawCommunity[]) {
  return communities.filter((c) => c.type === 'SYSTEM_ASSET' && c.viewerMembership && c.assetId)
}

export function toAssetTile(asset: RawAsset, communitySlug: string, favorite = false): AssetTile {
  return {
    handle: `$${asset.symbol}`,
    symbol: asset.symbol,
    name: asset.name,
    changePct: asset.priceChangePct,
    price: asset.price,
    stale: asset.priceStale,
    communitySlug,
    path: communityPath('asset', asset.symbol),
    favorite,
  }
}

/**
 * The personal channels the viewer is a member of, by their owner (specs/favorites): following a
 * person is being a member of their channel, and its favorite is the person's.
 */
export function followedChannels(communities: readonly RawCommunity[]) {
  return new Map(
    communities
      .filter((c) => c.type === 'PERSONAL_CHANNEL' && c.viewerMembership && c.createdByProfileId)
      .map((c) => [c.createdByProfileId!, { slug: c.slug, favorite: c.viewerIsFavorite === true }]),
  )
}

/** Favorites first, the rest in the order they came (specs/favorites FV-01). */
export function favoritesFirst<T extends { favorite: boolean }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => Number(b.favorite) - Number(a.favorite))
}

export function toPerson(
  user: RawUserSummary,
  channel?: { slug: string; favorite: boolean },
): Person {
  return {
    handle: `@${user.username}`,
    path: communityPath('user', user.username),
    id: user.id,
    username: user.username,
    avatarUrl: allowedImageUrl(user.avatarUrl),
    accuracyRate: user.accuracyRate ?? null,
    // Its channel's slug is its username (backend), when not among the viewer's first page.
    channelSlug: channel?.slug ?? user.username,
    favorite: channel?.favorite ?? false,
  }
}

/** A text that says something, or null: blanks are nothing (IR-01, IR-02). */
const text = (value: string | null | undefined) => value?.trim() || null

/** Non-asset communities the viewer belongs to, moderated ones first. */
export function toGroups(communities: readonly RawCommunity[]): Group[] {
  return (
    communities
      .filter(
        (c) => c.viewerMembership && c.type !== 'SYSTEM_ASSET' && c.type !== 'PERSONAL_CHANNEL',
      )
      .map((c) => ({
        handle: communityHandle(c),
        slug: c.slug,
        path: communityPath(kindOf(c.type), c.slug),
        name: c.name,
        description: text(c.description),
        topPostTitle: text(c.topPost?.title),
        memberCount: c.memberCount,
        avatarUrl: allowedImageUrl(c.avatarUrl),
        isModerator:
          c.viewerMembership === 'MODERATOR' || c.viewerMembership === 'PRINCIPAL_MODERATOR',
        favorite: c.viewerIsFavorite === true,
      }))
      // Favorites first (specs/favorites FV-01), then the ones the viewer moderates.
      .sort(
        (a, b) =>
          Number(b.favorite) - Number(a.favorite) || Number(b.isModerator) - Number(a.isModerator),
      )
  )
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
      path: communityPath(kindOf(c.type), c.slug),
      name: c.name,
      memberCount: c.memberCount,
      description: text(c.description),
      topPostTitle: text(c.topPost?.title),
      avatarUrl: allowedImageUrl(c.avatarUrl),
    }))
}
