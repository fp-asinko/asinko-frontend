import { z } from 'zod'

// E14 (docs/references/api/E14-primitivas-financieras.md). Raw backend shapes.
// The MVP catalog is crypto only (docs/product/overview.md § Menciones).

export const assetSchema = z.object({
  id: z.uuid(),
  symbol: z.string(),
  /** MIC (ISO 10383); null for crypto. */
  exchange: z.string().nullable(),
  name: z.string(),
  assetClass: z.enum(['EQUITY', 'CRYPTO', 'ETF', 'FOREX', 'INDEX', 'COMMODITY', 'OTHER']),
  price: z.number().nullable(),
  priceChangePct: z.number().nullable(),
  priceUpdatedAt: z.iso.datetime().nullable(),
  /** true when the market API failed and this is the last known price. */
  priceStale: z.boolean(),
  sentiment: z.object({
    bullishPct: z.number(),
    bearishPct: z.number(),
    totalVotes: z.number().int(),
  }),
  viewerSentiment: z.enum(['BULLISH', 'BEARISH']).nullable(),
})

/** GET /api/v1/assets/{symbol}: the asset plus its open theses and linked community. */
export const assetPageSchema = assetSchema.extend({
  /** Theses arrive in phase 2 (E11); empty until then. */
  openTheses: z.array(z.unknown()),
  linkedCommunity: z.object({ id: z.uuid(), slug: z.string(), name: z.string() }).nullable(),
})

export type RawAsset = z.infer<typeof assetSchema>

/**
 * GET /api/v1/assets?q= (E14, catalog and autocomplete). The backend returns at most a short
 * list, without a cursor: `nextCursor` is optional.
 */
export const assetCatalogSchema = z.object({
  items: z.array(assetSchema),
  nextCursor: z.string().nullable().optional(),
})
