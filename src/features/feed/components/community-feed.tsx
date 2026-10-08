import { Suspense } from 'react'
import { getOrThrow, mockDelay } from '@/lib/api'
import { getViewer } from '@/lib/session'
import { getAds } from '../lib/ads-api'
import { getFeed } from '../lib/feed-api'
import { parseFeedParams, type FeedParams } from '../schemas/feed-params.schema'
import { FeedFilters } from './feed-filters'
import { FeedListSkeleton } from './feed-list-skeleton'
import { FeedListView } from './feed-view'

/**
 * The feed of a community page (specs/community-pages CP-07): the Home's cards, filters and
 * paging, for one community. The page already resolved the community, so the list does not ask
 * for it again; it streams on its own, keyed by the filter, like the Home (specs/feed-navigation).
 * Posting starts from the header's "Create post" (specs/post-create-detail PC-03), not a box here.
 */
export async function CommunityFeed({
  slug,
  handle,
  pagePath,
  searchParams,
}: {
  slug: string
  handle: string
  /** The page itself (/hub/macro): where the filters link to. */
  pagePath: string
  searchParams: Promise<unknown>
}) {
  const { filter } = parseFeedParams(await searchParams)
  const params: FeedParams = { feed: 'for-you', filter, community: slug }

  return (
    <>
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
  const [result, ads] = await Promise.all([
    getFeed(params, undefined, { communityResolved: true, signedIn: viewer !== null }),
    getAds('feed'),
  ])
  // The feed is the page's main content after its header: an unexpected failure goes to error.tsx.
  const page = getOrThrow(result)
  return (
    <FeedListView
      params={params}
      state={{
        status: 'ok',
        items: page.items,
        nextCursor: page.nextCursor,
        ads: ads.ok ? ads.data : [],
      }}
      communityHandle={handle}
    />
  )
}
