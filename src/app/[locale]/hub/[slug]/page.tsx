import type { Metadata } from 'next'
import { PageColumns } from '@/components/organisms/app-shell'
import { communityMetadata, CommunityRoutePage } from '@/features/communities'

// A group's page: /hub/{slug} in every locale (specs/community-pages CP-01). Outside (main) and
// without loading.tsx: the community resolves before anything streams, so a redirect is a real 308
// and an unknown community a real 404 (a loading boundary would send a 200 first).
export async function generateMetadata({
  params,
}: PageProps<'/[locale]/hub/[slug]'>): Promise<Metadata> {
  const { locale, slug } = await params
  return communityMetadata('group', decodeURIComponent(slug), locale)
}

export default async function HubPage({ params }: PageProps<'/[locale]/hub/[slug]'>) {
  const { locale, slug } = await params
  return (
    <PageColumns>
      <CommunityRoutePage kind="group" slug={decodeURIComponent(slug)} locale={locale} />
    </PageColumns>
  )
}
