import 'server-only'
import { cache } from 'react'
import { apiRequest } from '@/lib/api'
import { assetPageSchema, communitySchema, type RawEntity } from '@/lib/api/contract'
import { assetSymbolSchema } from '@/lib/communities/asset-symbol.schema'
import { communitySlugSchema } from '@/lib/communities/community-slug.schema'
import type { MentionLookup } from './mentions'

/**
 * The community of a mentioned asset, by its symbol: `$NVDA` → `{ assetId, slug }`. Cached per
 * request: a page mentions the same asset in several posts.
 */
const assetCommunity = cache(async (symbol: string) => {
  const result = await apiRequest({
    method: 'GET',
    path: '/api/v1/assets/:symbol',
    params: { symbol },
    schema: assetPageSchema,
  })
  const slug = result.ok ? result.data.linkedCommunity?.slug : undefined
  return result.ok && slug ? { assetId: result.data.id, slug } : null
})

/** A mentioned group, by its slug: `#macro` → `{ id, slug }`. Cached per request. */
const mentionedCommunity = cache(async (slug: string) => {
  const result = await apiRequest({
    method: 'GET',
    path: '/api/v1/communities/:slug',
    params: { slug },
    schema: communitySchema,
  })
  return result.ok ? { id: result.data.id, slug: result.data.slug } : null
})

/**
 * What the $ and # mentions of a page need to link (P-001): each one resolved on its own, by the
 * text the author wrote. GET /communities was asked before, but it comes 20 at a time and the
 * backend has more than a hundred (every asset): most mentions stayed plain text, without their
 * hover card (specs/mention-preview MP-01, 2026-10-25). A mention links only when what its text
 * finds is the entity it refers to (resolvedId): an old name never links somewhere else. If a
 * request fails, that mention stays plain text.
 */
export async function lookupMentions(entities: readonly RawEntity[]): Promise<MentionLookup> {
  const symbols = new Set<string>()
  const slugs = new Set<string>()
  for (const entity of entities) {
    const text = entity.raw.slice(1)
    if (entity.type === 'TICKER' && assetSymbolSchema.safeParse(text).success) symbols.add(text)
    if (entity.type === 'COMMUNITY' && communitySlugSchema.safeParse(text).success) slugs.add(text)
  }
  const [assets, communities] = await Promise.all([
    Promise.all([...symbols].map(assetCommunity)),
    Promise.all([...slugs].map(mentionedCommunity)),
  ])
  const byAsset = new Map(assets.flatMap((each) => (each ? [[each.assetId, each.slug]] : [])))
  const byId = new Map(communities.flatMap((each) => (each ? [[each.id, each.slug]] : [])))
  return {
    communityOfAsset: (assetId) => byAsset.get(assetId),
    communitySlug: (id) => byId.get(id),
  }
}
