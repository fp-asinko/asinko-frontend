import type { Metadata } from 'next'
import { PageColumns } from '@/components/organisms/app-shell'
import { communityMetadata, CommunityTop, resolveCommunityRoute } from '@/features/communities'
import { CommunityFeed } from '@/features/feed'

// A group's page: /hub/{slug} in every locale (specs/community-pages CP-01). Outside (main) and
// without loading.tsx: the community resolves before anything streams, so a redirect is a real 308
// and an unknown community a real 404 (a loading boundary would send a 200 first). The feed then
// streams with its own skeleton.
export async function generateMetadata({
  params,
}: PageProps<'/[locale]/hub/[slug]'>): Promise<Metadata> {
  const { locale, slug } = await params
  return communityMetadata('group', decodeURIComponent(slug), locale)
}

export default async function HubPage({ params, searchParams }: PageProps<'/[locale]/hub/[slug]'>) {
  const { locale, slug } = await params
  const { page, path } = await resolveCommunityRoute('group', decodeURIComponent(slug), locale)
  return (
    <PageColumns>
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
