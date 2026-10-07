import type { Metadata } from 'next'
import { PageColumns } from '@/components/organisms/app-shell'
import { communityMetadata, CommunityRoutePage } from '@/features/communities'

// An asset's page: /asset/{SYMBOL} in every locale (specs/community-pages CP-01, CP-09). Outside
// (main) and without loading.tsx, as /hub: real 308 redirects and 404s.
export async function generateMetadata({
  params,
}: PageProps<'/[locale]/asset/[symbol]'>): Promise<Metadata> {
  const { locale, symbol } = await params
  return communityMetadata('asset', decodeURIComponent(symbol), locale)
}

export default async function AssetPage({ params }: PageProps<'/[locale]/asset/[symbol]'>) {
  const { locale, symbol } = await params
  return (
    <PageColumns>
      <CommunityRoutePage kind="asset" slug={decodeURIComponent(symbol)} locale={locale} />
    </PageColumns>
  )
}
