import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { env } from '@/env'
import { buildAlternates, OG_LOCALES } from '@/i18n/alternates'
import { safeLocale } from '@/i18n/safe-locale'
import { brandImagePath, shareImage } from '@/lib/share-image/share-metadata'
import { communityPath, type CommunityKind } from '@/lib/communities/paths'
import { notFound } from 'next/navigation'
import { getOrThrow } from '@/lib/api'
import type { CommunityPage, ProfileDetails } from '../communities.types'
import { getCommunityPage } from '../lib/community-api'
import { resolveCommunityPage } from '../lib/community-route'
import { getProfileDetails } from '../lib/profile-api'
import { CommunityDetails } from './community-details'
import { CommunityHeader } from './community-header'

/**
 * Title, description, canonical and hreflang of a community page (CP-03). A community that does
 * not resolve gets no metadata of its own: the page shows the not-found page or redirects.
 */
export async function communityMetadata(
  kind: CommunityKind,
  slug: string,
  rawLocale: string,
): Promise<Metadata> {
  const locale = safeLocale(rawLocale)
  const result = await getCommunityPage(slug)
  if (!result.ok || result.data.kind !== kind) return {}
  const page = result.data
  const t = await getTranslations({ locale, namespace: 'communities.meta' })
  // A profile is titled with its display name when there is one.
  const profile = kind === 'user' ? await getProfileDetails(page.slug) : null
  const title = (profile?.ok && profile.data.displayName) || page.handle
  const description =
    (profile?.ok && profile.data.bio) ||
    page.description ||
    t('description', { handle: page.handle })
  // The page's openGraph replaces the layout's: the site's name and the brand's image go again
  // (specs/share-preview SP-04).
  const site = await getTranslations({ locale, namespace: 'metadata' })
  const image = shareImage(brandImagePath(locale), site('description'))
  return {
    title,
    description,
    alternates: buildAlternates(env.NEXT_PUBLIC_SITE_URL, locale, communityPath(kind, page.slug)),
    openGraph: {
      title,
      description,
      siteName: site('title'),
      locale: OG_LOCALES[locale],
      ...image.openGraph,
    },
    twitter: image.twitter,
  }
}

/** The community of a route, or its 404 or redirect (CP-02), with the page's own path. */
export async function resolveCommunityRoute(kind: CommunityKind, slug: string, locale: string) {
  const page = await resolveCommunityPage(slug, kind, safeLocale(locale))
  return { page, path: communityPath(kind, page.slug) }
}

/**
 * A /user page: the personal channel (404 or redirect as any community) and the profile, in
 * parallel (specs/community-pages § 12). A profile that does not exist is the not-found page.
 */
export async function resolveProfileRoute(username: string, locale: string) {
  const [route, profile] = await Promise.all([
    resolveCommunityRoute('user', username, locale),
    getProfileDetails(username),
  ])
  if (!profile.ok && (profile.code === 'NOT_FOUND' || profile.code === 'INVALID')) notFound()
  return { ...route, profile: getOrThrow(profile) }
}

/** The top of a community's page: header and details (specs/community-pages). */
export function CommunityTop({ page, profile }: { page: CommunityPage; profile?: ProfileDetails }) {
  return (
    <>
      <CommunityHeader page={page} profile={profile} />
      <CommunityDetails page={page} profile={profile} />
    </>
  )
}
