import 'server-only'
import { cache } from 'react'
import { apiRequest, invalidInput, type ApiResult } from '@/lib/api'
import { communitySchema } from '@/lib/api/contract'
import { communitySlugSchema } from '@/lib/communities/community-slug.schema'
import type { CommunityPage } from '../communities.types'
import { toCommunityPage } from './mappers'

const ENDPOINT = 'GET /api/v1/communities/:slug'

/**
 * The community behind a /hub, /asset or /user page (specs/community-pages § 3). The slug is
 * checked before the request. Never throws: the page turns NOT_FOUND into notFound(), a kind
 * that belongs on another route into a redirect, and anything else into error.tsx. Cached per
 * request: the metadata and the page ask for the same community.
 */
export const getCommunityPage = cache(async function getCommunityPage(
  slug: string,
): Promise<ApiResult<CommunityPage>> {
  if (!communitySlugSchema.safeParse(slug).success) return invalidInput(ENDPOINT)
  const result = await apiRequest({
    method: 'GET',
    path: '/api/v1/communities/:slug',
    params: { slug },
    schema: communitySchema,
  })
  return result.ok ? { ok: true, data: toCommunityPage(result.data) } : result
})
