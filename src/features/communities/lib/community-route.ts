import 'server-only'
import { notFound } from 'next/navigation'
import { getOrThrow } from '@/lib/api'
import { permanentRedirect } from '@/i18n/navigation'
import { communityPath, type CommunityKind } from '@/lib/communities/paths'
import type { Locale } from '@/i18n/routing'
import type { ApiResult } from '@/lib/api'
import type { AssetSummary, CommunityPage } from '../communities.types'
import { getAssetSummary } from './asset-api'
import { getCommunityPage } from './community-api'

/**
 * The community of a /hub, /asset or /user page, or the way out (specs/community-pages CP-02):
 *
 * - A community that does not exist (or an invalid slug) is the not-found page.
 * - A community of another kind redirects to its own page (/hub/BTC → /asset/BTC,
 *   /user/macro → /hub/macro), 308. An /asset page goes by resolveAssetPage.
 * - Any other failure throws: the community is the page's main content (error.tsx).
 */
export async function resolveCommunityPage(
  slug: string,
  kind: CommunityKind,
  locale: Locale,
): Promise<CommunityPage> {
  const result = await getCommunityPage(slug)
  if (!result.ok && (result.code === 'NOT_FOUND' || result.code === 'INVALID')) notFound()
  const page = getOrThrow(result)
  // Asked with another casing: its canonical URL. Of another kind: its own page.
  if (page.kind !== kind || page.slug !== slug) permanentRedirect({ href: page.path, locale })
  return page
}

/** An asset of the catalog, as typed or in upper case. */
async function findAsset(symbol: string): Promise<ApiResult<AssetSummary>> {
  const result = await getAssetSummary(symbol)
  if (!result.ok && result.code === 'NOT_FOUND' && symbol !== symbol.toUpperCase()) {
    return getAssetSummary(symbol.toUpperCase())
  }
  return result
}

/**
 * An /asset page (specs/backend-answer-1013 BA-09, specs/backend-answer-1020 BA-10): the asset by
 * its symbol, then its community by `linkedCommunity`, never by a slug made from the symbol (an
 * asset's slug is not its symbol: brk-b). Asked with another casing, the canonical symbol
 * redirects, 308. Without a community yet, the asset alone. Not in the catalog, a community of
 * another kind by that slug redirects to its own page; nothing, the not-found page.
 */
export async function resolveAssetPage(
  symbol: string,
  locale: Locale,
): Promise<{ kind: 'community'; page: CommunityPage } | { kind: 'asset'; asset: AssetSummary }> {
  const asset = await findAsset(symbol)
  if (!asset.ok && (asset.code === 'NOT_FOUND' || asset.code === 'INVALID')) {
    // Not an asset: a community of another kind by that slug goes to its own page (/asset/defi →
    // /hub/defi, 308); nothing, the not-found page.
    const other = await getCommunityPage(symbol)
    if (other.ok && other.data.kind !== 'asset') {
      permanentRedirect({ href: other.data.path, locale })
    }
    notFound()
  }
  const found = getOrThrow(asset)
  if (found.symbol !== symbol) {
    permanentRedirect({ href: communityPath('asset', found.symbol), locale })
  }
  if (!found.communitySlug) return { kind: 'asset', asset: found }
  const community = await getCommunityPage(found.communitySlug)
  if (!community.ok && community.code === 'NOT_FOUND') return { kind: 'asset', asset: found }
  return { kind: 'community', page: getOrThrow(community) }
}
