import 'server-only'
import { apiRequest, type ApiResult } from '@/lib/api'
import { assetPageSchema, communitySchema } from '@/lib/api/contract'
import { assetSymbolSchema } from '@/lib/communities/asset-symbol.schema'
import { communitySlugSchema } from '@/lib/communities/community-slug.schema'

const ENDPOINT = 'POST /api/v1/posts'

/** One that cannot be tagged: the backend's own refusal (P-018), said before asking it. */
const refused = (): ApiResult<never> => ({
  ok: false,
  kind: 'expected',
  endpoint: ENDPOINT,
  code: 'INVALID_RELATED_COMMUNITY',
  errorKey: 'api.errors.UNKNOWN',
})

/** A group by its slug; never a personal channel (the backend refuses them). */
async function groupId(slug: string): Promise<ApiResult<string>> {
  if (!communitySlugSchema.safeParse(slug).success) return refused()
  const result = await apiRequest({
    method: 'GET',
    path: '/api/v1/communities/:slug',
    params: { slug },
    schema: communitySchema,
  })
  if (!result.ok) return result.code === 'NOT_FOUND' ? refused() : result
  return result.data.type === 'PERSONAL_CHANNEL' ? refused() : { ok: true, data: result.data.id }
}

/** An asset's community: its linkedCommunity, never a slug made from the symbol (2026-10-20). */
async function assetId(symbol: string): Promise<ApiResult<string>> {
  if (!assetSymbolSchema.safeParse(symbol).success) return refused()
  const result = await apiRequest({
    method: 'GET',
    path: '/api/v1/assets/:symbol',
    params: { symbol },
    schema: assetPageSchema,
  })
  if (!result.ok) return result.code === 'NOT_FOUND' ? refused() : result
  const community = result.data.linkedCommunity
  return community ? { ok: true, data: community.id } : refused()
}

/**
 * The ids of a post's related communities and assets (P-018, specs/backend-answer-1020 BA-06): the
 * editor holds them as handles (#macro, $GGAL), as its URL and its draft do; they go to the
 * backend as `relatedCommunityIds`. One that does not exist, or cannot be tagged, refuses the post
 * as the backend would (INVALID_RELATED_COMMUNITY).
 */
export async function relatedCommunityIds(
  handles: readonly string[],
): Promise<ApiResult<string[]>> {
  const results = await Promise.all(
    handles.map((handle) =>
      handle.startsWith('$') ? assetId(handle.slice(1)) : groupId(handle.slice(1)),
    ),
  )
  const failed = results.find((result) => !result.ok)
  if (failed && !failed.ok) return failed
  return { ok: true, data: results.flatMap((result) => (result.ok ? [result.data] : [])) }
}
