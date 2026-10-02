import 'server-only'
import { apiRequest, paginatedSchema } from '@/lib/api'
import { assetPageSchema, communitySchema, userSummarySchema } from '@/lib/api/contract'
import type { Viewer } from '@/lib/session'
import type { Interests, SectionResult } from '../interests.types'
import { memberAssetCommunities, toAssetTile, toGroups, toPerson, toSuggestions } from './mappers'

const failed = { ok: false } as const

function section<T>(data: T): SectionResult<T> {
  return { ok: true, data }
}

/**
 * Data of the "Your interests" column. Each section degrades on its own (H-19): a failed request
 * empties only that section. Unexpected failures are already reported by the API client.
 *
 * Contract limitation: GET /communities does not filter by membership, so the first page is
 * filtered here (proposal P-004 asks for ?member=true).
 */
export async function getInterests(viewer: Viewer | null): Promise<Interests> {
  const [communities, following] = await Promise.all([
    apiRequest({
      method: 'GET',
      path: '/api/v1/communities',
      schema: paginatedSchema(communitySchema),
    }),
    viewer
      ? apiRequest({
          method: 'GET',
          path: '/api/v1/users/:userId/following',
          params: { userId: viewer.id },
          schema: paginatedSchema(userSummarySchema),
        })
      : Promise.resolve({ ok: true as const, data: { items: [], nextCursor: null } }),
  ])

  const people = following.ok ? section(following.data.items.map(toPerson)) : failed
  if (!communities.ok) return { assets: failed, people, groups: failed, suggested: failed }

  const items = communities.data.items
  const assetCommunities = memberAssetCommunities(items)
  const assetPages = await Promise.all(
    assetCommunities.map((community) =>
      apiRequest({
        method: 'GET',
        path: '/api/v1/assets/:symbol',
        params: { symbol: community.slug.toUpperCase() },
        schema: assetPageSchema,
      }),
    ),
  )

  // A missing asset drops only its tile; the section fails only if every asset failed.
  const tiles = assetPages.flatMap((page, index) =>
    page.ok ? [toAssetTile(page.data, assetCommunities[index]!.slug)] : [],
  )
  const assets = tiles.length === 0 && assetPages.length > 0 ? failed : section(tiles)

  return {
    assets,
    people,
    groups: section(toGroups(items)),
    suggested: section(toSuggestions(items)),
  }
}
