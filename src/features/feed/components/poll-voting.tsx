'use client'

import { CheckIcon, MessageCircleIcon } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'
import { useOptimistic, useState, useTransition, type ReactNode } from 'react'
import { useAuthGate } from '@/components/organisms/auth-gate'
import { cn } from '@/lib/utils'
import { votePoll } from '../actions/vote-poll.action'
import type { PollItem, PollResults } from '../feed.types'
import { pollConsensus } from '../lib/poll-consensus'
import { pieColors } from '../lib/poll-pie'
import { CommentsToggle } from './comments-toggle'
import { PIE_SWATCHES, PollPie } from './poll-pie'

type Props = Pick<
  PollItem,
  | 'id'
  | 'options'
  | 'totalVotes'
  | 'viewerOptionId'
  | 'resultsVisible'
  | 'resultsVisibility'
  | 'isClosed'
  | 'allowVoteChange'
> & {
  /** "Closes in 3 days" / "Closed", formatted on the server (no clock mismatch on hydration). */
  closing: string | null
  /** Content of the comments button (icon and count), rendered by the card. */
  commentsLabel: ReactNode
  /** "See all comments" under them, rendered by the card (SeeAllComments). */
  seeAll?: ReactNode
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
 * Revision 4 (FC-24 to FC-28): the viewer's avatar marks their vote, each option shows its votes
 * and share, and after voting a note above the options says where the vote stands and invites to
 * tell why (it opens the comments).
 */
export function PollVoting({
  id,
  isClosed,
  resultsVisibility,
  allowVoteChange,
  closing,
  commentsLabel,
  seeAll,
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
  // FC-27: "Tell us why" opens the comments panel of this poll.
  const [commentsRequest, setCommentsRequest] = useState(0)
  // The option highlighted in the pie and in the list (specs/poll-pie PP-04).
  const [active, setActive] = useState<string | null>(null)

  const canVote = !isClosed && (results.viewerOptionId === null || allowVoteChange)
  // Decided once: a poll that loads votable keeps its buttons for the whole visit.
  const [asButtons] = useState(canVote)
  const { requireAccount, openGate, viewerAvatar } = useAuthGate()

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
  const asPercent = (share: number) =>
    format.number(share, { style: 'percent', maximumFractionDigits: 0 })
  // Said the other way round: how many do not share the viewer's view, and below how many do
  // (PO, 2026-10-26: "80% don't share your view", not "20% share it").
  const note = consensus
    ? {
        title: t('note.title', { rest: asPercent(1 - consensus.share) }),
        question: t(`note.${consensus.tier}`, { mine: asPercent(consensus.share) }),
      }
    : null
  const consensusText = note ? `${note.title} ${note.question}` : null
  // FC-21: the leading share (every option tied at the top leads).
  const top = Math.max(0, ...shown.options.map((option) => option.share ?? 0))
  // With results, a 3D pie beside the list, its legend (specs/poll-pie PP-01, PP-03).
  const withPie = shown.options.some((option) => (option.share ?? 0) > 0)
  const colors = pieColors(shown.options)
  // With results, the most voted first, in the pie and in its legend (PO, 2026-10-26). Stable: a
  // tie keeps the poll's order. Keyed by id, so a focused option stays the same element.
  const ordered = withPie
    ? [...shown.options].sort((a, b) => (b.share ?? 0) - (a.share ?? 0))
    : shown.options

  const footer = [
    // Why the results are hidden: a vote shows them, or only the close (ON_CLOSE: voting does not).
    !shown.resultsVisible && !isClosed
      ? t(resultsVisibility === 'ON_CLOSE' ? 'hiddenUntilClose' : 'hidden')
      : null,
    shown.totalVotes !== null ? t('votes', { count: shown.totalVotes }) : null,
    closing,
  ].filter((part): part is string => part !== null)

  return (
    <>
      {/* FC-26, FC-28: the note unfolds above the options (height animated, like the comments),
          so the options move down smoothly. For a vote cast earlier it is there from the start. */}
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out',
          note ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
          consensusEntry === 'after-bars' && 'delay-400',
        )}
      >
        <div className="min-h-0 overflow-hidden">
          {note && (
            <div
              data-consensus={consensus?.tier}
              className={cn(
                'mt-3.5 rounded-lg border px-3.5 py-3 transition-opacity duration-150 ease-out',
                pending && 'opacity-60',
              )}
            >
              {/* Larger than the rest of the card: it is the point of having voted (PO, 2026-10-26). */}
              <p className="type-post-title">{note.title}</p>
              <p className="mt-1 type-ui text-muted-foreground">{note.question}</p>
              <button
                type="button"
                onClick={() => setCommentsRequest((count) => count + 1)}
                className="mt-2.5 inline-flex h-8 tap items-center gap-1.5 rounded-full bg-muted px-3 type-action outline-none hover:bg-muted-hover focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <MessageCircleIcon aria-hidden className="size-3.5" />
                {t('note.cta')}
              </button>
            </div>
          )}
        </div>
      </div>
      <div className={cn('mt-3.5', withPie && 'flex flex-col gap-4 sm:flex-row sm:items-center')}>
        {withPie && (
          <PollPie options={ordered} active={active} onActive={setActive} className="self-center" />
        )}
        <ul data-revealed={revealed || undefined} className="flex min-w-0 flex-1 flex-col gap-2">
          {ordered.map((option) => {
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
                    // FC-20: the background fills to the share, on the GPU, also beside the pie (PO,
                    // 2026-10-26). Grows from 0 when revealed; a later vote transitions it. FC-21:
                    // softer unless leading.
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
                    {withPie && (
                      // The legend: the color of its slice; none without votes (PP-03).
                      <span
                        aria-hidden
                        data-swatch
                        className={cn(
                          'size-2.5 shrink-0 rounded-xs',
                          colors.has(option.id)
                            ? PIE_SWATCHES[colors.get(option.id)!]
                            : 'border border-border-strong',
                        )}
                      />
                    )}
                    <span className={cn('min-w-0', text)}>{option.label}</span>
                    {mine &&
                      // FC-24: the viewer's avatar on their vote, whether it leads or not; it pops
                      // on the tap. Without a known viewer (no provider), the check of FC-22.
                      (viewerAvatar ? (
                        <span
                          data-mine
                          className={cn(
                            'relative inline-flex shrink-0',
                            lastVotedId === option.id && 'animate-vote-pop',
                          )}
                        >
                          {viewerAvatar}
                          {/* The check of Reddit, small over the avatar's corner (10px, no ring). */}
                          <span
                            aria-hidden
                            data-mine-check
                            className="absolute -right-0.5 -bottom-0.5 flex size-2.5 items-center justify-center rounded-full bg-foreground text-background"
                          >
                            <CheckIcon className="size-1.75" strokeWidth={4} />
                          </span>
                        </span>
                      ) : (
                        <CheckIcon
                          aria-hidden
                          data-mine
                          className={cn(
                            'size-4 shrink-0 text-foreground',
                            lastVotedId === option.id && 'animate-vote-pop',
                          )}
                        />
                      ))}
                    {mine && !asButtons && <span className="sr-only">({t('yourVote')})</span>}
                  </span>
                  {percent && (
                    // FC-25: the votes, and the share smaller and gray beside them.
                    <span
                      className={cn(
                        'flex shrink-0 items-baseline gap-1.5 tabular-nums',
                        revealed && 'animate-fade-in',
                      )}
                    >
                      {option.votes !== null && (
                        <span className={text ?? undefined}>{format.number(option.votes)}</span>
                      )}
                      <span
                        className={
                          option.votes !== null
                            ? 'type-meta font-normal text-muted-foreground'
                            : (text ?? undefined)
                        }
                      >
                        {percent}
                      </span>
                    </span>
                  )}
                </span>
              </>
            )
            const box = cn(
              // A locked option does not press in: nothing happens when tapped.
              // HR-09: a gray box, no border, like Reddit; the fill darkens it to the share.
              'tap relative block w-full overflow-hidden rounded-lg bg-surface px-3.5 py-2.5 text-left type-ui font-medium transition-colors duration-150 aria-disabled:active:scale-100',
              // Its slice highlighted in the pie, and the other way round (PP-04).
              active === option.id && 'bg-muted',
            )
            const highlight = withPie
              ? {
                  onPointerEnter: () => setActive(option.id),
                  onPointerLeave: () => setActive(null),
                }
              : {}
            return (
              <li key={option.id} {...highlight}>
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
      </div>
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
        <CommentsToggle kind="poll" id={id} openRequest={commentsRequest} seeAll={seeAll}>
          {commentsLabel}
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
    </>
  )
}
