'use server'

import { assetSymbolSchema } from '@/lib/communities/asset-symbol.schema'
import { assetQuote, type AssetQuote } from '../lib/theses-api'

/**
 * The chosen asset's price, next to the thesis's target (specs/thesis-create TC-05). The browser
 * never calls the API (api-integration.md). Public data: no session needed. Null when it cannot be
 * read: the form goes on without it.
 */
export async function getAssetQuote(raw: unknown): Promise<AssetQuote | null> {
  const symbol = assetSymbolSchema.safeParse(raw)
  return symbol.success ? assetQuote(symbol.data) : null
}
