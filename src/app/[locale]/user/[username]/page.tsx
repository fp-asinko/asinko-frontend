import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PageColumns } from '@/components/organisms/app-shell'
import { communityMetadata, CommunityTop, resolveProfileRoute } from '@/features/communities'
import { ComposeScope } from '@/features/composer'
// By its path, not the feature's index: the index also brings the post page's client parts (seo.md).
import { CommunityFeed } from '@/features/feed/components/community-feed'
// By their paths too: the groups' and assets' pages, which use the index, do not need them.
import { ProfileTabs } from '@/features/communities/components/profile-tabs'
import { ThesesList } from '@/features/communities/components/theses-list'
import { ThesesListSkeleton } from '@/features/communities/components/theses-list-skeleton'
import { parseProfileTab } from '@/features/communities/schemas/profile-tab.schema'

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
  const [{ page, path, profile }, query] = await Promise.all([
    resolveProfileRoute(decodeURIComponent(username), locale),
    searchParams,
  ])
  const tab = parseProfileTab(query)
  return (
    <PageColumns>
      {/* Only the owner posts on a profile (403 PERSONAL_CHANNEL_OWNER_ONLY). */}
      {profile.isSelf && <ComposeScope id={page.id} handle={page.handle} name={page.handle} own />}
      <CommunityTop page={page} profile={profile} />
      {/* Posts · Theses, as X (specs/profile-track-record PT-04). */}
      <ProfileTabs pagePath={path} current={tab} />
      {tab === 'theses' ? (
        <Suspense fallback={<ThesesListSkeleton />}>
          <ThesesList userId={profile.id} handle={page.handle} isSelf={profile.isSelf} />
        </Suspense>
      ) : (
        <CommunityFeed
          slug={page.slug}
          handle={page.handle}
          pagePath={path}
          searchParams={searchParams}
        />
      )}
    </PageColumns>
  )
}
