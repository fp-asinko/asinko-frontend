import 'server-only'
import { notFound } from 'next/navigation'
import { getOrThrow } from '@/lib/api'
import { permanentRedirect } from '@/i18n/navigation'
import { communityPath, type CommunityKind } from '@/lib/communities/paths'
import type { Locale } from '@/i18n/routing'
import type { CommunityPage } from '../communities.types'
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
  let result = await getCommunityPage(slug)
  if (
    !result.ok &&
    result.code === 'NOT_FOUND' &&
    kind === 'asset' &&
    slug !== slug.toUpperCase()
  ) {
    result = await getCommunityPage(slug.toUpperCase())
  }
  if (!result.ok && (result.code === 'NOT_FOUND' || result.code === 'INVALID')) notFound()
  const page = getOrThrow(result)
  // The asset found in upper case, or one asked with another casing: its canonical URL.
  if (page.kind === kind && page.slug !== slug) {
    permanentRedirect({ href: communityPath(kind, page.slug), locale })
  }
  if (page.kind !== kind) permanentRedirect({ href: communityPath(page.kind, page.slug), locale })
  return page
}
