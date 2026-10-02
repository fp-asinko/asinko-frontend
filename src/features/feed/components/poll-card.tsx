import { ChartBarIcon, MessageSquareIcon } from 'lucide-react'
import { useFormatter, useNow, useTranslations } from 'next-intl'
import type { PollItem } from '../feed.types'
import { CardByline } from './card-byline'
import { CommentsToggle } from './comments-toggle'
import { PollVoting } from './poll-voting'

/**
 * Poll card of the prototype (H-13): byline, question and the POLL badge on the server; options,
 * results and voting in PollVoting, the client leaf (H-15).
 */
export function PollCard({ poll }: { poll: PollItem }) {
  const t = useTranslations('feed.poll')
  const tc = useTranslations('feed.comments')
  const format = useFormatter()
  const now = useNow()
  const closing = poll.isClosed
    ? t('closed')
    : poll.closesAt
      ? t('closes', { time: format.relativeTime(new Date(poll.closesAt), now) })
      : null

  return (
    <article
      className="px-4 py-4.5 wrap-anywhere md:px-6 md:py-5.5"
      aria-labelledby={`poll-${poll.id}`}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <CardByline
          author={poll.author}
          community={poll.community}
          publishedAt={poll.publishedAt}
        />
        <span className="inline-flex shrink-0 items-center gap-1.25 type-action font-extrabold uppercase">
          <ChartBarIcon aria-hidden className="size-3.5" />
          {t('badge')}
        </span>
      </div>

      <h2 id={`poll-${poll.id}`} className="type-post-title font-medium">
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
        comments={
          // The contract's Poll has no commentCount (proposal P-006): the button shows a label.
          <CommentsToggle kind="poll" id={poll.id}>
            <MessageSquareIcon aria-hidden className="size-4" />
            {tc('label')}
          </CommentsToggle>
        }
      />
    </article>
  )
}
