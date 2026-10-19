import type { Metadata } from 'next'
import { Suspense, type ReactNode } from 'react'
import { PageColumns } from '@/components/organisms/app-shell'
import { communityMetadata, CommunityTop, resolveProfileRoute } from '@/features/communities'
import { ComposeScope } from '@/features/composer'
// By its path, not the feature's index: the index also brings the post page's client parts (seo.md).
import { CommunityFeed } from '@/features/feed/components/community-feed'
// By their paths too: the groups' and assets' pages, which use the index, do not need them.
import { FeaturedScope } from '@/features/communities/components/featured-scope'
import { ProfileShowcase } from '@/features/communities/components/profile-showcase'
import { ProfileTabs } from '@/features/communities/components/profile-tabs'
import { ThesesList } from '@/features/communities/components/theses-list'
import { ThesesListSkeleton } from '@/features/communities/components/theses-list-skeleton'
import { FEATURED_MAX, getProfileFeatured } from '@/features/communities/lib/featured-api'
import { parseProfileTab } from '@/features/communities/schemas/profile-tab.schema'
import { ReplyListSkeleton } from '@/features/feed/components/reply-list-skeleton'
import { UserReplies } from '@/features/feed/components/user-replies'

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
  // What the person put at the front (specs/profile-showcase PS-05): secondary, none if it fails.
  const featured = await getProfileFeatured(profile.id)

  const content: ReactNode = (
    <>
      {/* Only the owner posts on a profile (403 PERSONAL_CHANNEL_OWNER_ONLY). */}
      {profile.isSelf && (
        <ComposeScope id={page.id} slug={page.slug} handle={page.handle} name={page.handle} own />
      )}
      <CommunityTop page={page} profile={profile} />
      <ProfileShowcase profile={profile} featured={featured} pagePath={path} />
      {/* Theses · Posts · Replies, as X (specs/profile-track-record PT-04, specs/backend-adoption). */}
      <ProfileTabs pagePath={path} current={tab} />
      {tab === 'replies' ? (
        <Suspense fallback={<ReplyListSkeleton />}>
          <UserReplies userId={profile.id} handle={page.handle} isSelf={profile.isSelf} />
        </Suspense>
      ) : tab === 'theses' ? (
        <Suspense fallback={<ThesesListSkeleton />}>
          <ThesesList
            userId={profile.id}
            handle={page.handle}
            isSelf={profile.isSelf}
            record={profile}
          />
        </Suspense>
      ) : (
        <CommunityFeed
          slug={page.slug}
          handle={page.handle}
          pagePath={path}
          searchParams={searchParams}
          // The profile's tabs are its only row of pills, as the prototype (2026-10-09).
          filters={false}
          // Everything the person published, in any community (specs/backend-adoption BK-02).
          author={profile.id}
        />
      )}
    </>
  )

  return (
    <PageColumns>
      {/* Your own profile: "⋯" on your posts and theses features them (PS-07). */}
      {profile.isSelf ? (
        <FeaturedScope
          featured={featured.map((item) => `${item.kind}:${item.id}`)}
          max={FEATURED_MAX}
        >
          {content}
        </FeaturedScope>
      ) : (
        content
      )}
    </PageColumns>
  )
}
