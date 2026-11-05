import type { ReactNode } from 'react'
import type { FeedParams } from '../schemas/feed-params.schema'
import { FeedSort } from './feed-sort'
import { FeedTypeMenu } from './feed-type-menu'

/**
 * The order and the type of a community page's feed, on their own line: it has no tabs
 * (specs/feed-type-filter FT-11). On the Home they go beside the tabs (FeedTabs).
 */
export function FeedFilters({
  params,
  pagePath,
}: {
  params: FeedParams
  /** The page itself: the filters stay on it (specs/community-pages CP-07). */
  pagePath: string
}) {
  return (
    <div className="mb-3 flex items-center gap-1.5">
      <FeedSort params={params} pagePath={pagePath} />
      <FeedTypeMenu params={params} pagePath={pagePath} />
    </div>
  )
}

/** The community the Home is filtered by, under the tab bar, only when there is one (FT-03). */
export function FeedChipRow({ chip }: { chip?: ReactNode }) {
  if (!chip) return null
  return <div className="-mt-1 mb-3 flex flex-wrap items-center gap-1.5">{chip}</div>
}
