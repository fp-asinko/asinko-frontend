import type { Metadata } from 'next'
import { PageColumns } from '@/components/organisms/app-shell'
import { communityMetadata, CommunityTop, resolveProfileRoute } from '@/features/communities'
import { CommunityFeed } from '@/features/feed'

// A user's page: /user/{username} in every locale (specs/community-pages § 12). Outside (main) and
// without loading.tsx, as /hub: real 308 redirects and 404s.
export async function generateMetadata({
  params,
}: PageProps<'/[locale]/user/[username]'>): Promise<Metadata> {
  const { locale, username } = await params
  return communityMetadata('user', decodeURIComponent(username), locale)
}

export default async function UserPage({
  params,
  searchParams,
}: PageProps<'/[locale]/user/[username]'>) {
  const { locale, username } = await params
  const { page, path, profile } = await resolveProfileRoute(decodeURIComponent(username), locale)
  return (
    <PageColumns>
      <CommunityTop page={page} profile={profile} />
      <CommunityFeed
        slug={page.slug}
        handle={page.handle}
        pagePath={path}
        searchParams={searchParams}
      />
    </PageColumns>
  )
}
