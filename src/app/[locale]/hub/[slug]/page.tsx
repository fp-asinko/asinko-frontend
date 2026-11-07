import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { PageColumns, PageHero } from '@/components/organisms/app-shell'
import { CommunityHeader, communityMetadata, resolveCommunityRoute } from '@/features/communities'
// By their paths: the profiles' and assets' pages, which use the feature's index, do not need them.
import { EditWidgetsButton } from '@/features/communities/components/widgets/editor/edit-widgets-button'
import { GroupAboutFold } from '@/features/communities/components/widgets/group-aside'
import {
  EditGroupButton,
  EditGroupProvider,
} from '@/features/communities/components/edit-group/edit-group-button'
import { GroupChecklist } from '@/features/communities/components/edit-group/group-checklist'
import { canModerate } from '@/features/communities/lib/can-moderate'
import { groupChecklistCookie } from '@/features/communities/lib/checklist-cookie'
import { groupSteps } from '@/features/communities/lib/group-steps'
import { toEditableGroup } from '@/features/communities/lib/mappers'
import { getWidgets } from '@/features/communities/lib/widgets-api'
import { PostMarkdown } from '@/features/feed/components/post-markdown'
import { ComposeScope } from '@/features/composer'
// By its path, not the feature's index: the index also brings the post page's client parts (seo.md).
import { CommunityFeed } from '@/features/feed/components/community-feed'
import { communityHasPosts } from '@/features/feed/lib/feed-api'

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
  // A moderator edits the widgets from the header (specs/community-widgets CW-08); the backend
  // checks it again on Save (CW-13). Cached: the column and the fold ask for the same.
  // Not offered when they could not be asked: Save would replace them with an empty list.
  const moderates = canModerate(page)
  // "Get your group started" for its moderators, unless hidden here (specs/community-edit CE-07,
  // CE-08); whether it has posts only when the card can show (one more request).
  const checklistHidden =
    !moderates || (await cookies()).get(groupChecklistCookie(page.id))?.value === 'hidden'
  const [widgets, hasPosts] = await Promise.all([
    moderates ? getWidgets(page.slug) : null,
    checklistHidden ? true : communityHasPosts(page.slug),
  ])
  const content = (
    <>
      {/* The banner and the header over both columns from lg, as Reddit's (specs/community-widgets
          CW-01); the feed and the right column under them. */}
      <PageHero>
        <CommunityHeader
          page={page}
          moderation={
            moderates && (
              <>
                {/* Its presentation, for its moderators (specs/community-edit CE-01). */}
                <EditGroupButton />
                {widgets && (
                  <EditWidgetsButton slug={page.slug} communityId={page.id} widgets={widgets} />
                )}
              </>
            )
          }
        />
      </PageHero>
      <PageColumns>
        <ComposeScope
          id={page.id}
          slug={page.slug}
          handle={page.handle}
          name={page.subtitle ?? page.handle}
        />
        {!checklistHidden && (
          <GroupChecklist groupId={page.id} slug={page.slug} steps={groupSteps(page, hasPosts)} />
        )}
        {/* Under lg, its details and widgets fold under the header (specs/community-widgets CW-04). */}
        <GroupAboutFold page={page} markdown={(body) => <PostMarkdown>{body}</PostMarkdown>} />
        <CommunityFeed
          slug={page.slug}
          handle={page.handle}
          pagePath={path}
          searchParams={searchParams}
        />
      </PageColumns>
    </>
  )
  // The window of "Edit group", for the header's button and the card's steps.
  return moderates ? (
    <EditGroupProvider group={toEditableGroup(page)}>{content}</EditGroupProvider>
  ) : (
    content
  )
}
