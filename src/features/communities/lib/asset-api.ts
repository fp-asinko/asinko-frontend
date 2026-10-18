import 'server-only'
import { cache } from 'react'
import { apiRequest, invalidInput, type ApiResult } from '@/lib/api'
import { assetPageSchema } from '@/lib/api/contract'
import { assetSymbolSchema } from '@/lib/communities/asset-symbol.schema'
import { allowedImageUrl } from '@/lib/images'
import type { AssetSummary } from '../communities.types'

const ENDPOINT = 'GET /api/v1/assets/:symbol'

/**
 * An asset of the catalog, for its page (specs/backend-answer-1013 BA-09, specs/backend-adoption
 * BK-05): name, logo, its market data, and the slug of its community when there is one. The symbol is
 * checked before the request. Cached per request: the metadata and the page ask for the same one.
 */
export const getAssetSummary = cache(async function getAssetSummary(
  symbol: string,
): Promise<ApiResult<AssetSummary>> {
  if (!assetSymbolSchema.safeParse(symbol).success) return invalidInput(ENDPOINT)
  const result = await apiRequest({
    method: 'GET',
    path: '/api/v1/assets/:symbol',
    params: { symbol },
    schema: assetPageSchema,
  })
  if (!result.ok) return result
  const asset = result.data
  return {
    ok: true,
    data: {
      symbol: asset.symbol,
      handle: `$${asset.symbol}`,
      name: asset.name,
      logoUrl: allowedImageUrl(asset.logoUrl ?? null),
      communitySlug: asset.linkedCommunity?.slug ?? null,
      market:
        asset.price === null
          ? null
          : {
              price: asset.price,
              changePct: asset.priceChangePct,
              stale: asset.priceStale,
              updatedAt: asset.priceUpdatedAt,
              currency: asset.assetClass === 'FOREX' ? null : 'USD',
            },
    },
  }
})
