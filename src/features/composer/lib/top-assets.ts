import 'server-only'
import { apiRequest, type ApiResult } from '@/lib/api'
import { topThesisAssetsSchema } from '@/lib/api/contract'
import type { TopAsset } from '../composer.types'
import { toOption } from './composer-api'

/**
 * The assets with the most theses in the last 30 days, for the thesis form's rail (P-040,
 * specs/thesis-form-steps FS-04): at most 10, the most first. Never throws: the page shows no rail
 * when it fails (FS-07).
 */
export async function getTopThesisAssets(): Promise<ApiResult<TopAsset[]>> {
  const result = await apiRequest({
    method: 'GET',
    path: '/api/v1/theses/top-assets',
    query: { days: '30', limit: '10' },
    schema: topThesisAssetsSchema,
  })
  if (!result.ok) return result
  return {
    ok: true,
    data: result.data.items.map(({ community, thesisCount }) => ({
      option: toOption({ ...community, tags: [] }, false),
      thesisCount,
    })),
  }
}
