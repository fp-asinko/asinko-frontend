import { Suspense } from 'react'
import { getOrThrow, mockDelay } from '@/lib/api'
import { getViewer } from '@/lib/session'
import { getFeed } from '../lib/feed-api'
import { parseFeedParams, type FeedParams } from '../schemas/feed-params.schema'
import { ComposerPlaceholder } from './composer-placeholder'
import { FeedFilters } from './feed-filters'
import { FeedListSkeleton } from './feed-list-skeleton'
import { FeedListView } from './feed-view'

/**
 * The feed of a community page (specs/community-pages CP-07): the Home's cards, filters and
 * paging, for one community. The page already resolved the community, so the list does not ask
 * for it again; it streams on its own, keyed by the filter, like the Home (specs/feed-navigation).
 * Where the viewer can post (a group, an asset, their own profile), the composer box comes first
 * and says where the post goes (specs/post-create-detail PC-03).
 */
export async function CommunityFeed({
  slug,
  handle,
  pagePath,
  searchParams,
  canPost,
}: {
  slug: string
  handle: string
  /** The page itself (/hub/macro): where the filters link to. */
  pagePath: string
  searchParams: Promise<unknown>
  /** Shows the composer box: not on someone else's profile. */
  canPost: boolean
}) {
  const [{ filter }, viewer] = await Promise.all([
    searchParams.then(parseFeedParams),
    canPost ? getViewer() : null,
  ])
  const params: FeedParams = { feed: 'for-you', filter, community: slug }

  return (
    <>
      {canPost && (
        <div className="mt-3.5 border-t">
          <ComposerPlaceholder viewerName={viewer?.username ?? null} communityHandle={handle} />
        </div>
      )}
      {/* Air after the header or its details box, as the prototype. */}
      <div className="px-2 pt-3.5 sm:px-0">
        <FeedFilters params={params} pagePath={pagePath} />
      </div>
      <Suspense key={filter} fallback={<FeedListSkeleton />}>
        <CommunityFeedList params={params} handle={handle} />
      </Suspense>
    </>
  )
}

async function CommunityFeedList({ params, handle }: { params: FeedParams; handle: string }) {
  // A slow backend on demand, for the e2e of the streaming (mocks only, never production).
  await mockDelay()
  const viewer = await getViewer()
  const result = await getFeed(params, undefined, {
    communityResolved: true,
    signedIn: viewer !== null,
  })
  // The feed is the page's main content after its header: an unexpected failure goes to error.tsx.
  const page = getOrThrow(result)
  return (
    <FeedListView
      params={params}
      state={{ status: 'ok', items: page.items, nextCursor: page.nextCursor }}
      communityHandle={handle}
    />
  )
}
