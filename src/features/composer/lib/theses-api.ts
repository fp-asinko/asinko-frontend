import 'server-only'
import { apiRequest, type ApiResult } from '@/lib/api'
import { assetPageSchema, thesisSchema } from '@/lib/api/contract'
import { assetSymbolSchema } from '@/lib/communities/asset-symbol.schema'
import type { CreateThesisInput } from '../schemas/create-thesis.schema'

/**
 * Publishes a thesis (E11, specs/thesis-create TC-13). The userId always comes from the server
 * session (api-integration.md); the backend takes the reference price itself (E14-02).
 */
export async function createThesisAs(
  userId: string,
  { direction, disclaimerAccepted, ...input }: CreateThesisInput,
): Promise<ApiResult<{ id: string }>> {
  const result = await apiRequest({
    method: 'POST',
    path: '/api/v1/theses',
    body: { userId, ...input, targetDirection: direction, disclaimerAccepted },
    schema: thesisSchema.pick({ id: true }),
  })
  return result.ok ? { ok: true, data: { id: result.data.id } } : result
}

/** An asset's price, as the thesis editor shows it next to the target (TC-05). */
export type AssetQuote = { price: number | null; stale: boolean }

/** GET /assets/{symbol} (E14), only its price. A symbol outside the catalog's shape never leaves. */
export async function assetQuote(symbol: string): Promise<AssetQuote | null> {
  if (!assetSymbolSchema.safeParse(symbol).success) return null
  const result = await apiRequest({
    method: 'GET',
    path: '/api/v1/assets/:symbol',
    params: { symbol },
    schema: assetPageSchema.pick({ price: true, priceStale: true }),
  })
  return result.ok ? { price: result.data.price, stale: result.data.priceStale } : null
}
