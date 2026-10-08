import 'server-only'
import { z } from 'zod'
import { apiRequest, keepValidItems, type ApiResult } from '@/lib/api'
import { adSchema, type RawAd } from '@/lib/api/contract'
import { allowedImageUrl } from '@/lib/images'
import type { CommentAd } from '../feed.types'

const ENDPOINT = 'GET /api/v1/ads'

/** Ads are validated one by one: a broken one goes, the rest show (api-integration.md). */
const looseListSchema = z.object({ items: z.array(z.unknown()) })

/** An ad's link only when it is http(s), with its real domain (security.md § 1). */
function toCommentAd(ad: RawAd): CommentAd | null {
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

/**
 * The house ads between a post's comments (P-015, specs/post-detail-refresh PD-08). A secondary
 * part of the page: if they fail, the caller shows the comments without ads.
 */
export async function getCommentAds(): Promise<ApiResult<CommentAd[]>> {
  const result = await apiRequest({
    method: 'GET',
    path: '/api/v1/ads',
    query: { placement: 'comments' },
    schema: looseListSchema,
  })
  if (!result.ok) return result
  const ads = keepValidItems(result.data.items, adSchema, ENDPOINT)
  return { ok: true, data: ads.map(toCommentAd).filter((ad) => ad !== null) }
}
