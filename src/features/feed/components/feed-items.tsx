import type { FeedItem } from '../feed.types'
import { FeedAd } from './feed-ad'
import { GlossaryCard } from './glossary-card'
import { PollCard } from './poll-card'
import { PostCard } from './post-card'

/**
 * The cards of one feed page, as list items. Shared by the first page and the ones loaded later.
 * Ads come inside the feed as their own kind, where the backend puts them (P-015, P-031,
 * specs/ads): the front does not place them. Glossary terms too, in the Home (specs/glossary).
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
  return items.map((item, index) => (
    // The same ad or glossary term may come twice in a page: its key carries its place (specs/ads,
    // specs/glossary).
    <li
      key={
        item.kind === 'ad' || item.kind === 'glossary'
          ? `${item.kind}-${item.id}-${index}`
          : `${item.kind}-${item.id}`
      }
    >
      {item.kind === 'post' ? (
        <PostCard post={item} fadeImage={later} feedCommunity={feedCommunity} menu={menus} />
      ) : item.kind === 'poll' ? (
        <PollCard poll={item} feedCommunity={feedCommunity} menu={menus} />
      ) : item.kind === 'glossary' ? (
        <GlossaryCard term={item} />
      ) : (
        <FeedAd ad={item} />
      )}
    </li>
  ))
}
