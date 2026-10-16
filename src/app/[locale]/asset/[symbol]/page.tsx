import type { Metadata } from 'next'
import { PageColumns } from '@/components/organisms/app-shell'
import {
  AssetWithoutCommunity,
  communityMetadata,
  CommunityTop,
  resolveAssetRoute,
} from '@/features/communities'
import { ComposeScope } from '@/features/composer'
// By its path, not the feature's index: the index also brings the post page's client parts (seo.md).
import { CommunityFeed } from '@/features/feed/components/community-feed'

// An asset's page: /asset/{SYMBOL} in every locale (specs/community-pages CP-01, CP-09). Outside
// (main) and without loading.tsx, as /hub: real 308 redirects and 404s.
export async function generateMetadata({
  params,
}: PageProps<'/[locale]/asset/[symbol]'>): Promise<Metadata> {
  const { locale, symbol } = await params
  return communityMetadata('asset', decodeURIComponent(symbol), locale)
}

export default async function AssetPage({
  params,
  searchParams,
}: PageProps<'/[locale]/asset/[symbol]'>) {
  const { locale, symbol } = await params
  const route = await resolveAssetRoute(decodeURIComponent(symbol), locale)
  // An asset of the catalog without its community yet (specs/backend-answer-1013 BA-09).
  if (route.kind === 'asset') {
    return (
      <PageColumns>
        <AssetWithoutCommunity asset={route.asset} />
      </PageColumns>
    )
  }
  const { page, path } = route
  return (
    <PageColumns>
      <ComposeScope
        id={page.id}
        slug={page.slug}
        handle={page.handle}
        name={page.subtitle ?? page.handle}
      />
      <CommunityTop page={page} />
      <CommunityFeed
        slug={page.slug}
        handle={page.handle}
        pagePath={path}
        searchParams={searchParams}
      />
    </PageColumns>
  )
}
