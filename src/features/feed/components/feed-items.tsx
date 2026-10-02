import type { FeedItem } from '../feed.types'
import { PollCard } from './poll-card'
import { PostCard } from './post-card'

/** The cards of one feed page, as list items. Shared by the first page and the ones loaded later. */
export function FeedItems({ items }: { items: FeedItem[] }) {
  return items.map((item) => (
    <li key={`${item.kind}-${item.id}`}>
      {item.kind === 'post' ? <PostCard post={item} /> : <PollCard poll={item} />}
    </li>
  ))
}
