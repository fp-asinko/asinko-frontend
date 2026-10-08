import 'server-only'
import { cache } from 'react'
import { z } from 'zod'
import { apiRequest, keepValidItems, type ApiResult } from '@/lib/api'
import { adSchema, type RawAd } from '@/lib/api/contract'
import { allowedImageUrl } from '@/lib/images'
import type { HouseAd } from '../feed.types'

const ENDPOINT = 'GET /api/v1/ads'

/** Ads are validated one by one: a broken one goes, the rest show (api-integration.md). */
const looseListSchema = z.object({ items: z.array(z.unknown()) })

/** An ad's link only when it is http(s), with its real domain (security.md § 1). */
function toHouseAd(ad: RawAd): HouseAd | null {
  try {
    const url = new URL(ad.url)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return {
      id: ad.id,
      advertiser: ad.advertiser.name,
      logoUrl: allowedImageUrl(ad.advertiser.logoUrl),
      body: ad.body,
      url: url.href,
      domain: url.hostname.replace(/^www\./, ''),
      imageUrl: allowedImageUrl(ad.imageUrl),
    }
  } catch {
    return null
  }
}

/** Where ads show: a post and its comments, or a feed (P-015). */
export type AdPlacement = 'comments' | 'feed'

/**
 * The house ads of a place (P-015, specs/post-detail-refresh PD-08, PD-15, PD-16). A secondary
 * part of the page: if they fail, the caller shows its content without ads. Cached per request:
 * a post and its comments share one request.
 */
export const getAds = cache(async function getAds(
  placement: AdPlacement,
): Promise<ApiResult<HouseAd[]>> {
  const result = await apiRequest({
    method: 'GET',
    path: '/api/v1/ads',
    query: { placement },
    schema: looseListSchema,
  })
  if (!result.ok) return result
  const ads = keepValidItems(result.data.items, adSchema, ENDPOINT)
  return { ok: true, data: ads.map(toHouseAd).filter((ad) => ad !== null) }
})
