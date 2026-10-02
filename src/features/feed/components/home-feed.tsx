import { notFound } from 'next/navigation'
import { getOrThrow } from '@/lib/api'
import { getViewer } from '@/lib/session'
import { getFeed } from '../lib/feed-api'
import { parseFeedParams } from '../schemas/feed-params.schema'
import { FeedView, type FeedState } from './feed-view'

/**
 * Loads the Home feed on the server. The feed is the page's main content: an unexpected failure
 * throws to error.tsx (with retry); an unknown community is a 404; Following without an account
 * shows its own state.
 */
export async function HomeFeed({ searchParams }: { searchParams: Promise<unknown> }) {
  const params = parseFeedParams(await searchParams)
  const [viewer, result] = await Promise.all([getViewer(), getFeed(params)])

  if (!result.ok) {
    if (result.code === 'NOT_FOUND' && params.comunidad) notFound()
    // Any other failure but a missing account throws: the feed is the main content.
    if (result.code !== 'UNAUTHENTICATED') getOrThrow(result)
  }
  const state: FeedState = result.ok
    ? { status: 'ok', items: result.data.items }
    : { status: 'needs-account' }

  return <FeedView params={params} state={state} viewerName={viewer?.username ?? null} />
}
