import { assetSymbolOf } from '@/lib/communities/paths'
import 'server-only'
import { apiRequest, paginatedSchema } from '@/lib/api'
import {
  assetPageSchema,
  communitySchema,
  userSummarySchema,
  type RawCommunity,
} from '@/lib/api/contract'
import type { Viewer } from '@/lib/session'
import type { Interests, SectionResult } from '../interests.types'
import {
  SUGGESTION_COUNT,
  favoritesFirst,
  followedChannels,
  memberAssetCommunities,
  toAssetTile,
  toGroups,
  toPerson,
  toSuggestions,
} from './mappers'

const failed = { ok: false } as const

function section<T>(data: T): SectionResult<T> {
  return { ok: true, data }
}

const emptyPage = { ok: true as const, data: { items: [], nextCursor: null } }

/**
 * Data of the "Your interests" column. Each section degrades on its own (H-19): a failed request
 * empties only that section. Unexpected failures are already reported by the API client.
 *
 * - Assets and Groups: GET /communities?mine=true (backend dev; needs a session, so without a
 *   viewer those sections stay empty).
 * - Suggested: the biggest communities from GET /communities that are not mine.
 *
 * `sampleAssets` is for development only: symbols to show when a signed-in account belongs to no
 * asset community, so the column can be shown with a fresh test account while the asset routes
 * are mocked (API_MOCKS=missing). The caller never passes it in production.
 */
export async function getInterests(
  viewer: Viewer | null,
  { sampleAssets = [] }: { sampleAssets?: readonly string[] } = {},
): Promise<Interests> {
  const communitiesPage = paginatedSchema(communitySchema)
  const [mine, all, following] = await Promise.all([
    viewer
      ? apiRequest({
          method: 'GET',
          path: '/api/v1/communities',
          query: { mine: 'true' },
          schema: communitiesPage,
        })
      : Promise.resolve(emptyPage),
    apiRequest({ method: 'GET', path: '/api/v1/communities', schema: communitiesPage }),
    viewer
      ? apiRequest({
          method: 'GET',
          path: '/api/v1/users/:userId/following',
          params: { userId: viewer.id },
          schema: paginatedSchema(userSummarySchema),
        })
      : Promise.resolve(emptyPage),
  ])

  // Whom the viewer marked as a favorite, by their channel (specs/favorites FV-01).
  const channels = followedChannels(mine.ok ? mine.data.items : [])
  const people = following.ok
    ? section(
        favoritesFirst(following.data.items.map((user) => toPerson(user, channels.get(user.id)))),
      )
    : failed
  const signedIn = viewer !== null
  const count = signedIn ? SUGGESTION_COUNT.signedIn : SUGGESTION_COUNT.guest
  const suggested = all.ok ? section(toSuggestions(all.data.items, count)) : failed
  if (!mine.ok) return { signedIn, assets: failed, people, groups: failed, suggested }

  // Each asset by its symbol and its community's slug, both from the community (BA-10).
  const members = memberAssetCommunities(mine.data.items).map((community) => ({
    slug: community.slug,
    symbol: assetSymbolOf(community),
    favorite: community.viewerIsFavorite === true,
  }))
  const chosen =
    members.length > 0 || !signedIn
      ? members
      : sampleAssetsOf(sampleAssets, all.ok ? all.data.items : [])
  const assetSlugs = chosen.map((each) => each.slug)
  const assetPages = await Promise.all(
    chosen.map(({ symbol }) =>
      apiRequest({
        method: 'GET',
        path: '/api/v1/assets/:symbol',
        params: { symbol },
        schema: assetPageSchema,
      }),
    ),
  )

  // A missing asset drops only its tile; the section fails only if every asset failed.
  const tiles = favoritesFirst(
    assetPages.flatMap((page, index) =>
      page.ok ? [toAssetTile(page.data, assetSlugs[index]!, chosen[index]!.favorite)] : [],
    ),
  )
  const assets = tiles.length === 0 && assetPages.length > 0 ? failed : section(tiles)

  return { signedIn, assets, people, groups: section(toGroups(mine.data.items)), suggested }
}

/** Each sample symbol with its community's slug, when the backend has one. */
function sampleAssetsOf(symbols: readonly string[], communities: readonly RawCommunity[]) {
  return symbols.map((symbol) => ({
    symbol,
    favorite: false,
    slug:
      communities.find(
        (community) => community.type === 'SYSTEM_ASSET' && assetSymbolOf(community) === symbol,
      )?.slug ?? symbol.toLowerCase(),
  }))
}
