import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { getOrThrow, mockDelay } from '@/lib/api'
import { getViewer, type Viewer } from '@/lib/session'
import { getFeed, getFilteredCommunity } from '../lib/feed-api'
import { parseFeedParams, type FeedParams } from '../schemas/feed-params.schema'
import { CommunityChip, CommunityChipSkeleton } from './community-chip'
import { FeedListSkeleton } from './feed-list-skeleton'
import { FeedListView, FeedTop, type FeedState } from './feed-view'

/**
 * The Home feed, streamed (specs/feed-navigation): the top (composer, tabs, filters) right away;
 * the community chip and the list each when the backend answers. Both Suspense are keyed by the
 * filters, so switching a tab, a filter or a community shows the skeleton at once instead of
 * freezing the old page until the feed arrives (FN-01).
 */
export async function HomeFeed({ searchParams }: { searchParams: Promise<unknown> }) {
  const params = parseFeedParams(await searchParams)
  const viewer = await getViewer()
  const key = `${params.feed}|${params.filter}|${params.community ?? ''}`
  const filtered = params.community !== undefined && params.feed === 'for-you'

  return (
    <>
      <FeedTop
        params={params}
        viewerName={viewer?.username ?? null}
        chip={
          filtered && (
            <Suspense key={key} fallback={<CommunityChipSkeleton />}>
              <FilteredCommunity params={params} />
            </Suspense>
          )
        }
      />
      <Suspense key={key} fallback={<FeedListSkeleton />}>
        <FeedList params={params} viewer={viewer} filtered={filtered} />
      </Suspense>
    </>
  )
}

/**
 * The filtered community: its name for the chip. An unknown one shows the not-found page (status
 * 200 with noindex, because the Home streams: specs/home § 5).
 */
async function FilteredCommunity({ params }: { params: FeedParams }) {
  // A slow backend on demand, for the e2e of the streaming (mocks only, never production).
  await mockDelay()
  const result = await getFilteredCommunity(params)
  if (result && !result.ok && result.code === 'NOT_FOUND') notFound()
  return <CommunityChip params={params} community={result?.ok ? result.data : null} />
}

/**
 * The list itself. The feed is the page's main content: an unexpected failure throws to error.tsx
 * (with retry). Following without an account shows its own state without asking the backend what
 * it would refuse (specs/guest-experience Q2).
 */
async function FeedList({
  params,
  viewer,
  filtered,
}: {
  params: FeedParams
  viewer: Viewer | null
  filtered: boolean
}) {
  if (params.feed === 'following' && !viewer) {
    return <FeedListView params={params} state={{ status: 'needs-account' }} />
  }
  // A slow backend on demand, for the e2e of the streaming (mocks only, never production).
  await mockDelay()
  // The chip resolves the community (and its not-found): the list does not ask for it again.
  const result = await getFeed(params, undefined, {
    communityResolved: filtered,
    signedIn: viewer !== null,
  })
  // Any failure but a missing account throws: the feed is the main content.
  if (!result.ok && result.code !== 'UNAUTHENTICATED') getOrThrow(result)
  const state: FeedState = result.ok
    ? { status: 'ok', items: result.data.items, nextCursor: result.data.nextCursor }
    : { status: 'needs-account' }

  return <FeedListView params={params} state={state} />
}
