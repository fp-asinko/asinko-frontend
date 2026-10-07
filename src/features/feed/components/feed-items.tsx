import type { FeedItem } from '../feed.types'
import { PollCard } from './poll-card'
import { PostCard } from './post-card'

/** The cards of one feed page, as list items. Shared by the first page and the ones loaded later. */
export function FeedItems({
  items,
  later = false,
  feedCommunity,
}: {
  items: FeedItem[]
  /** A page loaded with "Load more": its images fade in (D-M1). */
  later?: boolean
  /** The community the feed is filtered by: its cards do not repeat its join button (CP-07). */
  feedCommunity?: string
}) {
  return items.map((item) => (
    <li key={`${item.kind}-${item.id}`}>
      {item.kind === 'post' ? (
        <PostCard post={item} fadeImage={later} feedCommunity={feedCommunity} />
      ) : (
        <PollCard poll={item} feedCommunity={feedCommunity} />
      )}
    </li>
  ))
}
