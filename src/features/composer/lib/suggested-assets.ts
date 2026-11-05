import 'server-only'
import { apiRequest, paginatedSchema } from '@/lib/api'
import { communitySchema } from '@/lib/api/contract'
import type { SuggestedAssets } from '../composer.types'
import { toOption } from './composer-api'
import { getTopThesisAssets } from './top-assets'

/** Three, whole, beside the search (PO, 2026-11-05). */
const MAX = 3

/**
 * The assets beside the thesis form's search (specs/thesis-form-steps FS-04, PO 2026-11-05): the
 * viewer's own first, the asset communities they joined (favorites first, as "Your interests"),
 * then the ones with the most theses (P-040) to fill the row of three. With none of their own, it says
 * they are the popular ones. Never throws: whatever fails is left out, and nothing hides the row.
 */
export async function getSuggestedAssets(): Promise<SuggestedAssets> {
  const [mine, top] = await Promise.all([
    apiRequest({
      method: 'GET',
      path: '/api/v1/communities',
      query: { mine: 'true' },
      schema: paginatedSchema(communitySchema),
    }),
    getTopThesisAssets(),
  ])
  const interests = mine.ok
    ? mine.data.items
        .filter((each) => each.type === 'SYSTEM_ASSET' && each.viewerMembership && each.assetId)
        .sort((a, b) => Number(b.viewerIsFavorite === true) - Number(a.viewerIsFavorite === true))
        .map((each) => toOption(each, false))
    : []
  const seen = new Set(interests.map((each) => each.slug))
  const popular = top.ok
    ? top.data.map((each) => each.option).filter((each) => !seen.has(each.slug))
    : []
  return {
    basis: interests.length > 0 ? 'interests' : 'popular',
    assets: [...interests, ...popular].slice(0, MAX),
  }
}
