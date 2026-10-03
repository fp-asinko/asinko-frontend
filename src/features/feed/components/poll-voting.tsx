'use client'

import { CheckIcon, UsersIcon } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'
import { useOptimistic, useState, useTransition, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { votePoll } from '../actions/vote-poll.action'
import type { PollItem, PollResults } from '../feed.types'
import { pollConsensus, type Consensus } from '../lib/poll-consensus'

// One color per option (FC-04), repeated after 6: the label and the percentage carry the meaning.
// Full class names, never interpolated, so Tailwind generates them.
const OPTION_COLORS = [
  {
    fill: 'bg-poll-1',
    accent: 'hover:border-poll-1 focus-visible:border-poll-1',
    marker: 'group-hover:border-poll-1 group-focus-visible:border-poll-1',
  },
  {
    fill: 'bg-poll-2',
    accent: 'hover:border-poll-2 focus-visible:border-poll-2',
    marker: 'group-hover:border-poll-2 group-focus-visible:border-poll-2',
  },
  {
    fill: 'bg-poll-3',
    accent: 'hover:border-poll-3 focus-visible:border-poll-3',
    marker: 'group-hover:border-poll-3 group-focus-visible:border-poll-3',
  },
  {
    fill: 'bg-poll-4',
    accent: 'hover:border-poll-4 focus-visible:border-poll-4',
    marker: 'group-hover:border-poll-4 group-focus-visible:border-poll-4',
  },
  {
    fill: 'bg-poll-5',
    accent: 'hover:border-poll-5 focus-visible:border-poll-5',
    marker: 'group-hover:border-poll-5 group-focus-visible:border-poll-5',
  },
  {
    fill: 'bg-poll-6',
    accent: 'hover:border-poll-6 focus-visible:border-poll-6',
    marker: 'group-hover:border-poll-6 group-focus-visible:border-poll-6',
  },
] as const

const CONSENSUS_CLASSES: Record<Consensus['tier'], string> = {
  majority:
    'border-consensus-majority-border bg-consensus-majority text-consensus-majority-foreground',
  minority:
    'border-consensus-minority-border bg-consensus-minority text-consensus-minority-foreground',
  tie: 'border-border bg-surface text-foreground',
}

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
 * Color and motion (specs/feed-cards § 5): the box keeps its geometry before and after voting, so
 * results that arrive seconds later never move the card; only colors and contents change.
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
  // FC-09: the option voted in this visit; its check pops and the consensus fades in after the bars.
  const [lastVotedId, setLastVotedId] = useState<string | null>(null)

  const canVote = !isClosed && (results.viewerOptionId === null || allowVoteChange)
  // Decided once: a poll that loads votable keeps its buttons for the whole visit.
  const [asButtons] = useState(canVote)

  function vote(optionId: string) {
    if (pending || !canVote) return
    setError(null)
    setSaved(false)
    setLastVotedId(optionId)
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

  // From the server results only (never the optimistic choice), hidden while a new vote travels.
  const consensus = pending ? null : pollConsensus(results)
  const hasResults = shown.options.some((option) => option.share !== null)

  const footer = [
    !shown.resultsVisible && !isClosed ? t('hidden') : null,
    shown.totalVotes !== null ? t('votes', { count: shown.totalVotes }) : null,
    closing,
  ].filter((part): part is string => part !== null)

  return (
    <>
      {/* The results box (FC-04): always there, transparent until there are results. */}
      <div
        className={cn(
          'mt-3.5 rounded-xl border p-1.5 transition-colors duration-150 ease-out',
          hasResults ? 'bg-linear-to-b from-surface to-card' : 'border-transparent',
        )}
      >
        <ul data-revealed={revealed || undefined} className="flex flex-col gap-1.5">
          {shown.options.map((option, index) => {
            const mine = option.id === shown.viewerOptionId
            const color = OPTION_COLORS[index % OPTION_COLORS.length] ?? OPTION_COLORS[0]
            const percent =
              option.share === null
                ? null
                : format.number(option.share, { style: 'percent', maximumFractionDigits: 0 })
            const content = (
              <>
                <span className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2">
                    {/* D-C1: a radio before voting, the legend square after; never moves the label. */}
                    <span
                      aria-hidden
                      data-marker
                      className={cn(
                        'flex size-4 shrink-0 items-center justify-center rounded-xs border transition-colors duration-150 ease-out',
                        option.share !== null
                          ? cn('border-transparent text-card', color.fill)
                          : mine
                            ? 'border-foreground bg-foreground text-background'
                            : cn('border-input', canVote && color.marker),
                        revealed && option.share !== null && 'animate-fade-in',
                      )}
                    >
                      {mine && (
                        <CheckIcon
                          key={lastVotedId ?? 'loaded'}
                          strokeWidth={3}
                          className={cn('size-3', lastVotedId === option.id && 'animate-vote-pop')}
                        />
                      )}
                    </span>
                    <span className={cn('min-w-0', mine && 'font-bold text-foreground')}>
                      {option.label}
                    </span>
                    {mine && !asButtons && <span className="sr-only">({t('yourVote')})</span>}
                  </span>
                  {percent && (
                    <span
                      className={cn(
                        'shrink-0 tabular-nums',
                        mine ? 'font-bold text-foreground' : 'text-muted-foreground',
                        revealed && 'animate-fade-in',
                      )}
                    >
                      {percent}
                    </span>
                  )}
                </span>
                {option.share !== null && (
                  // Thin bar in the bottom padding (no layout change): full width, scaled to its
                  // share on the GPU. Grows from 0 when revealed; a later vote transitions it.
                  <span
                    aria-hidden
                    data-bar
                    className="absolute inset-x-3.5 bottom-1.5 h-1.5 overflow-hidden rounded-full bg-poll-track"
                  >
                    <span
                      className={cn(
                        'block size-full origin-left transition-transform duration-600 ease-bars',
                        color.fill,
                        revealed && 'animate-bar-grow',
                      )}
                      style={{ transform: `scaleX(${option.share})` }}
                    />
                  </span>
                )}
              </>
            )
            const box = cn(
              'group tap relative block w-full rounded-lg border px-3.5 pt-2.5 pb-4.5 text-left type-ui font-medium',
              hasResults ? 'border-transparent' : mine && 'border-foreground',
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
                      // FC-06: the option's color on hover and focus, while it can still be chosen.
                      canVote &&
                        cn(hasResults ? 'hover:bg-card' : 'hover:bg-surface', color.accent),
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
        {consensus && (
          <p
            // Replays when a changed vote changes the tier; delayed after the bars only when the
            // vote happened in this visit (a vote cast earlier shows at once).
            key={consensus.tier}
            className={cn(
              'mt-1.5 flex items-center gap-2 rounded-md border px-3 py-2 type-action',
              CONSENSUS_CLASSES[consensus.tier],
              lastVotedId !== null && 'animate-fade-up [animation-delay:400ms]',
            )}
          >
            <UsersIcon aria-hidden className="size-4 shrink-0" />
            {t(`consensus.${consensus.tier}`, {
              percent: format.number(consensus.share, {
                style: 'percent',
                maximumFractionDigits: 0,
              }),
            })}
          </p>
        )}
      </div>
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
