import { ChartBarIcon, CheckIcon, MessageSquareIcon } from 'lucide-react'
import { useFormatter, useNow, useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { PollItem } from '../feed.types'
import { CardByline } from './card-byline'
import { CommentsToggle } from './comments-toggle'

/**
 * Poll card of the prototype (H-13): question, options as 8px-radius rows and, when the results
 * are visible, a bar behind each option proportional to its share. Read-only until T-09 (voting).
 */
export function PollCard({ poll }: { poll: PollItem }) {
  const t = useTranslations('feed.poll')
  const tc = useTranslations('feed.comments')
  const format = useFormatter()
  const now = useNow()
  const footer = [
    !poll.resultsVisible && !poll.isClosed ? t('hidden') : null,
    poll.totalVotes !== null ? t('votes', { count: poll.totalVotes }) : null,
    poll.isClosed
      ? t('closed')
      : poll.closesAt
        ? t('closes', { time: format.relativeTime(new Date(poll.closesAt), now) })
        : null,
  ].filter((part): part is string => part !== null)

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

      <ul className="mt-3.5 flex flex-col gap-2">
        {poll.options.map((option) => {
          const mine = option.id === poll.viewerOptionId
          const percent =
            option.share === null
              ? null
              : format.number(option.share, { style: 'percent', maximumFractionDigits: 0 })
          return (
            <li
              key={option.id}
              className={cn(
                'relative overflow-hidden rounded-lg border px-3.5 py-2.5 type-ui font-medium',
                mine && 'border-foreground',
              )}
            >
              {option.share !== null && (
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 bg-muted"
                  style={{ width: `${option.share * 100}%` }}
                />
              )}
              <span className="relative flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-1.5">
                  {mine && <CheckIcon aria-hidden className="size-4 shrink-0" />}
                  <span className="min-w-0">{option.label}</span>
                  {mine && <span className="sr-only">({t('yourVote')})</span>}
                </span>
                {percent && <span className="shrink-0 font-bold tabular-nums">{percent}</span>}
              </span>
            </li>
          )
        })}
      </ul>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        {/* The contract's Poll has no commentCount (proposal P-006): the button shows a label. */}
        <CommentsToggle kind="poll" id={poll.id}>
          <MessageSquareIcon aria-hidden className="size-4" />
          {tc('label')}
        </CommentsToggle>
        {/* Each part is a whole message (no string concatenation); the dots are decorative. */}
        <p className="ml-auto flex flex-wrap gap-x-1.5 type-action font-medium text-muted-foreground">
          {footer.map((part, index) => (
            <span key={part} className="flex gap-x-1.5">
              {index > 0 && <span aria-hidden>·</span>}
              {part}
            </span>
          ))}
        </p>
      </div>
    </article>
  )
}
