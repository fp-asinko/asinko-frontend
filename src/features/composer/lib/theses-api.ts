import 'server-only'
import { apiRequest, type ApiResult } from '@/lib/api'
import { assetPageSchema, thesisSchema } from '@/lib/api/contract'
import { assetSymbolSchema } from '@/lib/communities/asset-symbol.schema'
import type { CreateThesisInput } from '../schemas/create-thesis.schema'

/**
 * Publishes a thesis (E11, specs/thesis-create TC-13). The userId always comes from the server
 * session (api-integration.md); the backend takes the reference price itself (E14-02). From a
 * draft, its id (P-038, specs/thesis-drafts TD-04).
 */
export async function createThesisAs(
  userId: string,
  { direction, disclaimerAccepted, ...input }: CreateThesisInput,
  draftId?: string,
): Promise<ApiResult<{ id: string }>> {
  const result = await apiRequest({
    method: 'POST',
    path: '/api/v1/theses',
    // From a draft of the account, with its id: the backend deletes it in the same operation (P-038).
    body: {
      userId,
      ...input,
      targetDirection: direction,
      disclaimerAccepted,
      ...(draftId && { draftId }),
    },
    schema: thesisSchema.pick({ id: true }),
  })
  return result.ok ? { ok: true, data: { id: result.data.id } } : result
}

/** An asset as the thesis editor's card shows it (TC-05, TC-22): its name, price and day. */
export type AssetQuote = {
  name: string
  price: number | null
  /** The day's change, in percent (2.14 is +2.14 %). */
  changePct: number | null
  stale: boolean
}

/** GET /assets/{symbol} (E14), only what the card shows. A symbol outside the catalog's shape never leaves. */
export async function assetQuote(symbol: string): Promise<AssetQuote | null> {
  if (!assetSymbolSchema.safeParse(symbol).success) return null
  const result = await apiRequest({
    method: 'GET',
    path: '/api/v1/assets/:symbol',
    params: { symbol },
    schema: assetPageSchema.pick({
      name: true,
      price: true,
      priceChangePct: true,
      priceStale: true,
    }),
  })
  if (!result.ok) return null
  const { name, price, priceChangePct, priceStale } = result.data
  return { name, price, changePct: priceChangePct, stale: priceStale }
}
