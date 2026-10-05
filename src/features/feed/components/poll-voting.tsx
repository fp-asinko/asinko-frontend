'use client'

import { useFormatter, useTranslations } from 'next-intl'
import { useOptimistic, useState, useTransition, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { votePoll } from '../actions/vote-poll.action'
import type { PollItem, PollResults } from '../feed.types'
import { pollConsensus, type Consensus } from '../lib/poll-consensus'

// One color per option (FC-15), repeated after 6: the label and the percentage carry the meaning.
// Full class names, never interpolated, so Tailwind generates them.
const OPTION_COLORS = [
  'bg-poll-1',
  'bg-poll-2',
  'bg-poll-3',
  'bg-poll-4',
  'bg-poll-5',
  'bg-poll-6',
] as const

// The banner tint (FC-17); its title is in the main text color, as in the prototype.
const CONSENSUS_CLASSES: Record<Consensus['tier'], string> = {
  majority: 'border-consensus-majority-border bg-consensus-majority',
  minority: 'border-consensus-minority-border bg-consensus-minority',
  tie: 'border-border bg-surface',
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
 * Look (specs/feed-cards § 12, as the prototype): clean buttons while the results are hidden;
 * otherwise compact rows (square, label, bar, percent) in a box, soft except the viewer's vote,
 * under the consensus banner. Both states share one tree (div > ul > li > button), so the button
 * with focus survives the change.
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
  // FC-09: the option voted in this visit; its check pops (with the optimistic choice, at the tap).
  const [lastVotedId, setLastVotedId] = useState<string | null>(null)
  // How the consensus enters: after the bars the first time it appears in this visit, at once
  // when a changed vote changes its tier, and without animation for a vote cast earlier.
  const [consensusSeen, setConsensusSeen] = useState(() => pollConsensus(initial) !== null)
  const [consensusEntry, setConsensusEntry] = useState<'after-bars' | 'now' | null>(null)

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
        if (pollConsensus(result.data)) {
          setConsensusEntry(consensusSeen ? 'now' : 'after-bars')
          setConsensusSeen(true)
        }
      } else
        setError(result.error === 'api.errors.UNAUTHENTICATED' ? tv('needAccount') : tv('error'))
    })
  }

  // From the server results only (never the optimistic choice); dimmed while a new vote travels.
  const consensus = pollConsensus(results)
  const consensusTitle = consensus
    ? t('consensus.title', {
        percent: format.number(consensus.share, { style: 'percent', maximumFractionDigits: 0 }),
      })
    : null
  const consensusText = consensus ? t(`consensus.${consensus.tier}`) : null
  const hasResults = shown.options.some((option) => option.share !== null)

  const footer = [
    !shown.resultsVisible && !isClosed ? t('hidden') : null,
    shown.totalVotes !== null ? t('votes', { count: shown.totalVotes }) : null,
    closing,
  ].filter((part): part is string => part !== null)

  return (
    <>
      <div
        className={cn(
          'relative mt-3.5',
          // The results box (FC-15): gradient, border and a thin line of the option colors on top.
          hasResults &&
            'overflow-hidden rounded-lg border bg-linear-to-b from-surface to-card p-3.5',
        )}
      >
        {hasResults && (
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-poll-1 via-poll-2 to-poll-3"
          />
        )}
        {consensus && (
          <div
            // Remounts (and enters again) only when a changed vote changes the tier. Inserted text
            // is not announced: the live region below says it together with the saved vote.
            key={consensus.tier}
            data-consensus={consensus.tier}
            className={cn(
              'mb-3 rounded-lg border px-4 pt-3.5 pb-3 transition-opacity duration-150 ease-out',
              CONSENSUS_CLASSES[consensus.tier],
              pending && 'opacity-60',
              consensusEntry === 'after-bars' && 'animate-fade-up delay-after-bars',
              consensusEntry === 'now' && 'animate-fade-up',
            )}
          >
            <p className="text-base font-bold text-foreground">{consensusTitle}</p>
            <p className="mt-0.5 type-meta text-muted-foreground italic">{consensusText}</p>
          </div>
        )}
        <ul
          data-revealed={revealed || undefined}
          className={cn('flex flex-col', hasResults ? 'gap-1.5' : 'gap-2')}
        >
          {shown.options.map((option, index) => {
            const mine = option.id === shown.viewerOptionId
            const fill = OPTION_COLORS[index % OPTION_COLORS.length] ?? OPTION_COLORS[0]
            // FC-16: soft unless it is the viewer's vote.
            const soft = !mine && 'opacity-45'
            const percent =
              option.share === null
                ? null
                : format.number(option.share, { style: 'percent', maximumFractionDigits: 0 })
            const yourVote = mine && !asButtons && (
              <span className="sr-only"> ({t('yourVote')})</span>
            )
            const content =
              option.share === null ? (
                // FC-18: a clean button (or, closed, a clean row) while the results are hidden.
                <span className="block min-w-0">
                  {option.label}
                  {yourVote}
                </span>
              ) : (
                <span className="grid grid-cols-[0.625rem_minmax(0,8.75rem)_1fr_2.25rem] items-center gap-2">
                  <span
                    aria-hidden
                    data-marker
                    className={cn(
                      'size-2.5 rounded-xs',
                      fill,
                      soft,
                      revealed && !mine && 'animate-fade-in',
                      // The pop moved here from the check (§ 12.4), on the tap that chose it.
                      mine && lastVotedId === option.id && 'animate-vote-pop',
                    )}
                  />
                  <span className={cn('min-w-0', mine && 'font-semibold text-foreground')}>
                    {option.label}
                    {yourVote}
                  </span>
                  <span
                    aria-hidden
                    data-bar
                    className="block h-2 overflow-hidden rounded-full bg-poll-track"
                  >
                    {/* Full width, scaled to its share on the GPU: grows from 0 when revealed, a
                        later vote transitions it. */}
                    <span
                      className={cn(
                        'block size-full origin-left transition-[transform,opacity] duration-600 ease-bars',
                        fill,
                        soft,
                        revealed && 'animate-bar-grow',
                      )}
                      style={{ transform: `scaleX(${option.share})` }}
                    />
                  </span>
                  <span
                    className={cn(
                      'text-right tabular-nums',
                      mine && 'font-semibold text-foreground',
                      revealed && 'animate-fade-in',
                    )}
                  >
                    {percent}
                  </span>
                </span>
              )
            const box = cn(
              // A locked option does not press in: nothing happens when tapped.
              'tap block w-full text-left aria-disabled:active:scale-100',
              option.share === null
                ? cn(
                    'rounded-lg border px-3.5 py-2.5 type-ui font-medium',
                    mine && 'border-foreground font-semibold',
                  )
                : '-mx-1.5 min-h-6 w-[calc(100%+0.75rem)] rounded-md px-1.5 py-0.5 type-action font-medium text-muted-foreground',
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
                      canVote && (option.share === null ? 'hover:bg-surface' : 'hover:bg-card'),
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
      </div>
      {/* Two whole sentences, never fragments of one: "Vote saved." and the consensus (WCAG 4.1.3). */}
      <p role="status" className="sr-only">
        {saved && (
          <>
            <span>{tv('saved')}</span>
            {consensus && (
              <span>
                {' '}
                {consensusTitle}. {consensusText}
              </span>
            )}
          </>
        )}
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
