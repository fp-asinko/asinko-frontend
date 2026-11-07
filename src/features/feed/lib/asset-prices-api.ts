import 'server-only'
import { cache } from 'react'
import { z } from 'zod'
import { apiRequest, keepValidItems } from '@/lib/api'
import { pricePointSchema, priceHistorySchema } from '@/lib/api/contract'
import { assetSymbolSchema } from '@/lib/communities/asset-symbol.schema'
import type { PricePoint } from '@/lib/theses/chart.types'

const ENDPOINT = 'GET /api/v1/assets/:symbol/prices'

const rangeSchema = z
  .object({ symbol: assetSymbolSchema, from: z.iso.datetime(), to: z.iso.datetime() })
  .refine(({ from, to }) => from < to)

/**
 * An asset's prices between two dates (P-046, specs/thesis-chart), oldest first. The symbol and the
 * dates are checked before the request. `null` if it cannot be asked: the chart is a secondary part
 * of the thesis's page, which shows the same without it (CH-06). A malformed point is dropped and
 * reported, not the whole history.
 */
export const getAssetPrices = cache(async function getAssetPrices(
  symbol: string,
  from: string,
  to: string,
): Promise<PricePoint[] | null> {
  if (!rangeSchema.safeParse({ symbol, from, to }).success) return null
  const result = await apiRequest({
    method: 'GET',
    path: '/api/v1/assets/:symbol/prices',
    params: { symbol },
    query: { from, to },
    schema: priceHistorySchema,
  })
  if (!result.ok) return null
  return keepValidItems(result.data.items, pricePointSchema, ENDPOINT)
    .map(({ at, price }) => ({ at, price }))
    .sort((a, b) => a.at.localeCompare(b.at))
})
