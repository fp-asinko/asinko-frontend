import type { FeedItem } from '../feed.types'
import { PollCard } from './poll-card'
import { PostCard } from './post-card'

/**
 * The cards of one feed page, as list items. Shared by the first page and the ones loaded later.
 * Ads, when the backend sends them, come inside the feed as their own kind (P-015,
 * specs/backend-answer-1013 BA-06): the front does not place them.
 */
export function FeedItems({
  items,
  later = false,
  feedCommunity,
  menus = false,
}: {
  items: FeedItem[]
  /** A page loaded with "Load more": its images fade in (D-M1). */
  later?: boolean
  /** The community the feed is filtered by: its cards do not repeat its join button (CP-07). */
  feedCommunity?: string
  /** A profile's list: each post offers "⋯" to feature it (specs/profile-showcase PS-07). */
  menus?: boolean
}) {
  return items.map((item) => (
    <li key={`${item.kind}-${item.id}`}>
      {item.kind === 'post' ? (
        <PostCard post={item} fadeImage={later} feedCommunity={feedCommunity} menu={menus} />
      ) : (
        <PollCard poll={item} feedCommunity={feedCommunity} />
      )}
    </li>
  ))
}
