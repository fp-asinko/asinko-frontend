import 'server-only'
import { apiRequest, paginatedSchema } from '@/lib/api'
import { assetPageSchema, communitySchema, userSummarySchema } from '@/lib/api/contract'
import type { Viewer } from '@/lib/session'
import type { Interests, SectionResult } from '../interests.types'
import {
  assetSymbol,
  SUGGESTION_COUNT,
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
 */
export async function getInterests(viewer: Viewer | null): Promise<Interests> {
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

  const people = following.ok ? section(following.data.items.map(toPerson)) : failed
  const signedIn = viewer !== null
  const count = signedIn ? SUGGESTION_COUNT.signedIn : SUGGESTION_COUNT.guest
  const suggested = all.ok ? section(toSuggestions(all.data.items, count)) : failed
  if (!mine.ok) return { signedIn, assets: failed, people, groups: failed, suggested }

  const assetCommunities = memberAssetCommunities(mine.data.items)
  const assetPages = await Promise.all(
    assetCommunities.map((community) =>
      apiRequest({
        method: 'GET',
        path: '/api/v1/assets/:symbol',
        params: { symbol: assetSymbol(community.slug) },
        schema: assetPageSchema,
      }),
    ),
  )

  // A missing asset drops only its tile; the section fails only if every asset failed.
  const tiles = assetPages.flatMap((page, index) =>
    page.ok ? [toAssetTile(page.data, assetCommunities[index]!.slug)] : [],
  )
  const assets = tiles.length === 0 && assetPages.length > 0 ? failed : section(tiles)

  return { signedIn, assets, people, groups: section(toGroups(mine.data.items)), suggested }
}
