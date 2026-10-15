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
 * - A community that does not exist (or an invalid slug) is the not-found page. On /asset, a
 *   symbol in lower case that does not exist is tried in upper case (the backend is
 *   case-sensitive and asset slugs are their symbol): /asset/btc → /asset/BTC.
 * - A community of another kind redirects to its own page (/hub/BTC → /asset/BTC,
 *   /asset/macro → /hub/macro), 308.
 * - Any other failure throws: the community is the page's main content (error.tsx).
 */
export async function resolveCommunityPage(
  slug: string,
  kind: CommunityKind,
  locale: Locale,
): Promise<CommunityPage> {
  const result = await findCommunityPage(slug, kind)
  if (!result.ok && (result.code === 'NOT_FOUND' || result.code === 'INVALID')) notFound()
  const page = getOrThrow(result)
  // The asset found in upper case, or one asked with another casing: its canonical URL.
  if (page.kind === kind && page.slug !== slug) {
    permanentRedirect({ href: communityPath(kind, page.slug), locale })
  }
  if (page.kind !== kind) permanentRedirect({ href: communityPath(page.kind, page.slug), locale })
  return page
}

/** The community of a slug; on /asset, a symbol in lower case is tried in upper case too. */
async function findCommunityPage(slug: string, kind: CommunityKind) {
  const result = await getCommunityPage(slug)
  if (
    !result.ok &&
    result.code === 'NOT_FOUND' &&
    kind === 'asset' &&
    slug !== slug.toUpperCase()
  ) {
    return getCommunityPage(slug.toUpperCase())
  }
  return result
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
 * An /asset page (specs/backend-answer-1013 BA-09, Q4): its community, as resolveCommunityPage; or,
 * when the asset has none yet, the asset alone (its canonical symbol redirects, 308). Not in the
 * catalog either: the not-found page.
 */
export async function resolveAssetPage(
  symbol: string,
  locale: Locale,
): Promise<{ kind: 'community'; page: CommunityPage } | { kind: 'asset'; asset: AssetSummary }> {
  const community = await findCommunityPage(symbol, 'asset')
  const missing = !community.ok && (community.code === 'NOT_FOUND' || community.code === 'INVALID')
  if (!missing)
    return { kind: 'community', page: await resolveCommunityPage(symbol, 'asset', locale) }

  const asset = await findAsset(symbol)
  if (!asset.ok && (asset.code === 'NOT_FOUND' || asset.code === 'INVALID')) notFound()
  const found = getOrThrow(asset)
  if (found.symbol !== symbol) {
    permanentRedirect({ href: communityPath('asset', found.symbol), locale })
  }
  return { kind: 'asset', asset: found }
}
