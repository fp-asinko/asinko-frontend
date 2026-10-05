'use client'

import { CheckIcon } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'
import { useOptimistic, useState, useTransition, type ReactNode } from 'react'
import { useAuthGate } from '@/components/organisms/auth-gate'
import { cn } from '@/lib/utils'
import { votePoll } from '../actions/vote-poll.action'
import type { PollItem, PollResults } from '../feed.types'
import { pollConsensus } from '../lib/poll-consensus'

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
 * Look (specs/feed-cards § 13, less is more): one shape, the prototype's clean box. With results
 * its background fills to the share in a single color; the leading option is full and bold, the
 * rest the same but softer. A check marks the viewer's vote. The box never changes size, so
 * results that arrive seconds later move nothing, and the focused button is never replaced.
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
  const { requireAccount, openGate } = useAuthGate()

  function vote(optionId: string) {
    // Without a session nothing is marked: the account modal opens (specs/guest-experience G-04).
    if (pending || !canVote || !requireAccount('vote-poll')) return
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
      } else if (result.error === 'api.errors.UNAUTHENTICATED') {
        // The session ended meanwhile (the action checks it too, security.md § 5).
        openGate('vote-poll')
      } else setError(tv('error'))
    })
  }

  // From the server results only (never the optimistic choice); dimmed while a new vote travels.
  const consensus = pollConsensus(results)
  const consensusText = consensus
    ? t('consensus', {
        percent: format.number(consensus.share, { style: 'percent', maximumFractionDigits: 0 }),
      })
    : null
  // FC-21: the leading share (every option tied at the top leads).
  const top = Math.max(0, ...shown.options.map((option) => option.share ?? 0))

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
          const leading = option.share !== null && top > 0 && option.share === top
          const percent =
            option.share === null
              ? null
              : format.number(option.share, { style: 'percent', maximumFractionDigits: 0 })
          const text =
            option.share === null
              ? null
              : leading
                ? 'font-semibold text-foreground'
                : 'text-muted-foreground'
          const content = (
            <>
              {option.share !== null && (
                <span
                  aria-hidden
                  data-bar
                  // FC-20: the background fills to the share, on the GPU. Grows from 0 when
                  // revealed; a later vote transitions it. FC-21: softer unless leading.
                  className={cn(
                    'absolute inset-0 origin-left bg-primary/10 transition-[transform,opacity] duration-600 ease-bars',
                    !leading && 'opacity-50',
                    revealed && 'animate-bar-grow',
                  )}
                  style={{ transform: `scaleX(${option.share})` }}
                />
              )}
              <span className="relative flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className={cn('min-w-0', text)}>{option.label}</span>
                  {mine && (
                    // FC-22: the viewer's vote, whether it leads or not; it pops on the tap.
                    <CheckIcon
                      aria-hidden
                      data-mine
                      className={cn(
                        'size-4 shrink-0 text-foreground',
                        lastVotedId === option.id && 'animate-vote-pop',
                      )}
                    />
                  )}
                  {mine && !asButtons && <span className="sr-only">({t('yourVote')})</span>}
                </span>
                {percent && (
                  <span
                    className={cn('shrink-0 tabular-nums', text, revealed && 'animate-fade-in')}
                  >
                    {percent}
                  </span>
                )}
              </span>
            </>
          )
          const box = cn(
            // A locked option does not press in: nothing happens when tapped.
            // HR-09: a gray box, no border, like Reddit; the fill darkens it to the share.
            'tap relative block w-full overflow-hidden rounded-lg bg-surface px-3.5 py-2.5 text-left type-ui font-medium aria-disabled:active:scale-100',
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
                    canVote && 'hover:bg-muted',
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
          // FC-23: one quiet line. Remounts (and enters again) only when a changed vote changes
          // the tier; inserted text is not announced, the live region below says it.
          key={consensus.tier}
          data-consensus={consensus.tier}
          className={cn(
            'mt-2 type-meta text-muted-foreground transition-opacity duration-150 ease-out',
            pending && 'opacity-60',
            consensusEntry === 'after-bars' && 'animate-fade-up delay-after-bars',
            consensusEntry === 'now' && 'animate-fade-up',
          )}
        >
          {consensusText}
        </p>
      )}
      {/* Two whole sentences, never fragments of one: "Vote saved." and the consensus (WCAG 4.1.3). */}
      <p role="status" className="sr-only">
        {saved && (
          <>
            <span>{tv('saved')}</span>
            {consensusText && <span> {consensusText}.</span>}
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
