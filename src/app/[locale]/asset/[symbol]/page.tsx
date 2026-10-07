import type { Metadata } from 'next'
import { PageColumns } from '@/components/organisms/app-shell'
import { communityMetadata, CommunityTop, resolveCommunityRoute } from '@/features/communities'
import { ComposeScope } from '@/features/composer'
import { CommunityFeed } from '@/features/feed'

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
  const { page, path } = await resolveCommunityRoute('asset', decodeURIComponent(symbol), locale)
  return (
    <PageColumns>
      <ComposeScope id={page.id} handle={page.handle} name={page.subtitle ?? page.handle} />
      <CommunityTop page={page} />
      <CommunityFeed
        slug={page.slug}
        handle={page.handle}
        pagePath={path}
        searchParams={searchParams}
        canPost
      />
    </PageColumns>
  )
}
