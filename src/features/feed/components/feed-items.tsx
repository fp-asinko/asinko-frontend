import type { FeedItem, HouseAd } from '../feed.types'
import { AD_EVERY } from '../lib/with-ads'
import { FeedAd } from './feed-ad'
import { PollCard } from './poll-card'
import { PostCard } from './post-card'

/**
 * The cards of one feed page, as list items. Shared by the first page and the ones loaded later.
 * After every 10th card of the whole feed (`offset`: the cards of the pages before), a house ad
 * (specs/post-detail-refresh PD-16); the ads rotate.
 */
export function FeedItems({
  items,
  later = false,
  feedCommunity,
  ads = [],
  offset = 0,
}: {
  items: FeedItem[]
  /** A page loaded with "Load more": its images fade in (D-M1). */
  later?: boolean
  /** The community the feed is filtered by: its cards do not repeat its join button (CP-07). */
  feedCommunity?: string
  ads?: readonly HouseAd[]
  /** How many cards the feed showed before this page. */
  offset?: number
}) {
  return items.flatMap((item, index) => {
    const position = offset + index + 1
    const ad =
      ads.length > 0 && position % AD_EVERY === 0
        ? ads[(position / AD_EVERY - 1) % ads.length]
        : undefined
    return [
      <li key={`${item.kind}-${item.id}`}>
        {item.kind === 'post' ? (
          <PostCard post={item} fadeImage={later} feedCommunity={feedCommunity} />
        ) : (
          <PollCard poll={item} feedCommunity={feedCommunity} />
        )}
      </li>,
      ...(ad
        ? [
            <li key={`ad-${position}`}>
              <FeedAd ad={ad} />
            </li>,
          ]
        : []),
    ]
  })
}
