'use client'

import { CheckIcon } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'
import { useOptimistic, useState, useTransition, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { votePoll } from '../actions/vote-poll.action'
import type { PollItem, PollResults } from '../feed.types'

type Props = Pick<
  PollItem,
  | 'id'
  | 'options'
  | 'totalVotes'
  | 'viewerOptionId'
  | 'resultsVisible'
  | 'isClosed'
  | 'allowVoteChange'
> & {
  /** "Closes in 3 days" / "Closed", formatted on the server (no clock mismatch on hydration). */
  closing: string | null
  /** The comments toggle, rendered by the card. */
  comments: ReactNode
}

/**
 * Options and footer of a poll (H-13, H-15). While the viewer can vote, each option is a button
 * (aria-pressed on the chosen one); the choice shows at once and the results arrive with the
 * server's answer. A closed poll, or one that does not allow changing a cast vote, is read-only.
 * Options that started as buttons stay buttons (aria-disabled once locked), so the focused option
 * is never unmounted (WCAG 2.4.3); the saved vote is announced in a live region.
 */
export function PollVoting({
  id,
  isClosed,
  allowVoteChange,
  closing,
  comments,
  ...initial
}: Props) {
  const t = useTranslations('feed.poll')
  const tv = useTranslations('feed.vote')
  const format = useFormatter()
  const [results, setResults] = useState<PollResults>(initial)
  const [shown, setShown] = useOptimistic(results)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  // M-02: true once a vote reveals results that were hidden; then the bars grow from 0.
  const [revealed, setRevealed] = useState(false)

  const canVote = !isClosed && (results.viewerOptionId === null || allowVoteChange)
  // Decided once: a poll that loads votable keeps its buttons for the whole visit.
  const [asButtons] = useState(canVote)

  function vote(optionId: string) {
    if (pending || !canVote) return
    setError(null)
    setSaved(false)
    startTransition(async () => {
      setShown({ ...results, viewerOptionId: optionId })
      const result = await votePoll({ pollId: id, optionId })
      if (result.ok) {
        if (!results.resultsVisible && result.data.resultsVisible) setRevealed(true)
        setResults(result.data)
        setSaved(true)
      } else
        setError(result.error === 'api.errors.UNAUTHENTICATED' ? tv('needAccount') : tv('error'))
    })
  }

  const footer = [
    !shown.resultsVisible && !isClosed ? t('hidden') : null,
    shown.totalVotes !== null ? t('votes', { count: shown.totalVotes }) : null,
    closing,
  ].filter((part): part is string => part !== null)

  return (
    <>
      <ul data-revealed={revealed || undefined} className="mt-3.5 flex flex-col gap-2">
        {shown.options.map((option) => {
          const mine = option.id === shown.viewerOptionId
          const percent =
            option.share === null
              ? null
              : format.number(option.share, { style: 'percent', maximumFractionDigits: 0 })
          const content = (
            <>
              {option.share !== null && (
                <span
                  aria-hidden
                  // Full width, scaled to its share: transform runs on the GPU (no layout per frame).
                  // Grows from 0 when revealed; a later change of option transitions the scale.
                  className={cn(
                    'absolute inset-0 origin-left bg-muted transition-transform duration-600 ease-bars',
                    revealed && 'animate-bar-grow',
                  )}
                  style={{ transform: `scaleX(${option.share})` }}
                />
              )}
              <span className="relative flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-1.5">
                  {mine && <CheckIcon aria-hidden className="size-4 shrink-0" />}
                  <span className="min-w-0">{option.label}</span>
                  {mine && !asButtons && <span className="sr-only">({t('yourVote')})</span>}
                </span>
                {percent && (
                  <span
                    className={cn('shrink-0 font-bold tabular-nums', revealed && 'animate-fade-in')}
                  >
                    {percent}
                  </span>
                )}
              </span>
            </>
          )
          const box = cn(
            'tap relative block w-full overflow-hidden rounded-lg border px-3.5 py-2.5 text-left type-ui font-medium',
            mine && 'border-foreground',
          )
          return (
            <li key={option.id}>
              {asButtons ? (
                <button
                  type="button"
                  aria-pressed={mine}
                  aria-disabled={pending || !canVote || undefined}
                  onClick={() => vote(option.id)}
                  className={cn(
                    box,
                    'outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                    canVote && 'hover:bg-surface',
                    pending && 'cursor-wait',
                  )}
                >
                  {content}
                </button>
              ) : (
                <div className={box}>{content}</div>
              )}
            </li>
          )
        })}
      </ul>
      <p role="status" className="sr-only">
        {saved ? tv('saved') : ''}
      </p>
      {error && (
        <p role="alert" className="mt-2 type-meta text-destructive">
          {error}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        {comments}
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
    </>
  )
}
