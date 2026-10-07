import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { env } from '@/env'
import { buildAlternates, OG_LOCALES } from '@/i18n/alternates'
import { routing, type Locale } from '@/i18n/routing'
import { communityPath, type CommunityKind } from '@/lib/communities/paths'
import { getCommunityPage } from '../lib/community-api'
import { resolveCommunityPage } from '../lib/community-route'

function safeLocale(locale: string): Locale {
  return routing.locales.find((each) => each === locale) ?? routing.defaultLocale
}

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
  const description = page.description ?? t('description', { handle: page.handle })
  return {
    title: page.handle,
    description,
    alternates: buildAlternates(env.NEXT_PUBLIC_SITE_URL, locale, communityPath(kind, page.slug)),
    openGraph: { title: page.handle, description, locale: OG_LOCALES[locale] },
  }
}

/** The page of a group or an asset (specs/community-pages): header and feed come in T-05/T-06. */
export async function CommunityRoutePage({
  kind,
  slug,
  locale,
}: {
  kind: CommunityKind
  slug: string
  locale: string
}) {
  const page = await resolveCommunityPage(slug, kind, safeLocale(locale))
  return <h1 className="px-4 pt-4 type-page-title sm:px-0">{page.handle}</h1>
}
