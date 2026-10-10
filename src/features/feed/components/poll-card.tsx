import { ChartBarIcon, MessageCircleIcon } from 'lucide-react'
import { useFormatter, useNow, useTranslations } from 'next-intl'
import type { PollItem } from '../feed.types'
import { countFormat } from '../lib/count-format'
import { CardByline } from './card-byline'
import { PollVoting } from './poll-voting'
import { SeeAllComments } from './see-all-comments'

/**
 * Poll card of the prototype (H-13): byline, question and the POLL badge on the server; options,
 * results and voting in PollVoting, the client leaf (H-15).
 */
export function PollCard({
  poll,
  feedCommunity,
}: {
  poll: PollItem
  /** The community the feed is filtered by: no join button for it (CP-07). */
  feedCommunity?: string
}) {
  const t = useTranslations('feed.poll')
  const tc = useTranslations('feed.card')
  const format = useFormatter()
  const now = useNow()
  const closing = poll.isClosed
    ? t('closed')
    : poll.closesAt
      ? t('closes', { time: format.relativeTime(new Date(poll.closesAt), now) })
      : null

  return (
    <article
      className="px-4 py-4.5 wrap-anywhere md:px-0 md:py-5.5"
      aria-labelledby={`poll-${poll.id}`}
    >
      <div className="mb-2">
        <CardByline
          author={poll.author}
          community={poll.community}
          publishedAt={poll.publishedAt}
          titleId={`poll-${poll.id}`}
          canJoin={poll.community?.slug !== feedCommunity}
          badge={
            <span className="inline-flex min-h-6 shrink-0 items-center gap-1.25 type-action font-extrabold uppercase">
              <ChartBarIcon aria-hidden className="size-3.5" />
              {t('badge')}
            </span>
          }
        />
      </div>

      {/* The community avatar moved to the header (specs/community-first § 1). */}
      <h2
        id={`poll-${poll.id}`}
        // Focus target when the join button disappears (CF-14); not in the tab order.
        tabIndex={-1}
        className="type-post-title font-medium outline-none"
      >
        {poll.question}
      </h2>

      <PollVoting
        id={poll.id}
        options={poll.options}
        totalVotes={poll.totalVotes}
        viewerOptionId={poll.viewerOptionId}
        resultsVisible={poll.resultsVisible}
        isClosed={poll.isClosed}
        allowVoteChange={poll.allowVoteChange}
        closing={closing}
        // Polls have no page yet: "Coming soon".
        seeAll={<SeeAllComments />}
        commentsLabel={
          // Same as a post's (P-006): the compact count, and the full sentence for screen readers.
          <>
            <MessageCircleIcon aria-hidden className="size-4" />
            <span aria-hidden>
              {format.number(poll.commentCount, countFormat(poll.commentCount))}
            </span>
            <span className="sr-only">{tc('comments', { count: poll.commentCount })}</span>
          </>
        }
      />
    </article>
  )
}
