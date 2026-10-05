'use client'

import { ArrowBigDownIcon, ArrowBigUpIcon } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'
import { useOptimistic, useState, useTransition } from 'react'
import { useAuthGate } from '@/components/organisms/auth-gate'
import { cn } from '@/lib/utils'
import { votePost } from '../actions/vote-post.action'
import { countFormat } from '../lib/count-format'

type Vote = { score: number; viewerVote: 1 | -1 | null }

/**
 * The last vote's motion (M-01): which arrow pops (only when voting, not when removing, Q2) and
 * which way the number rolls. null on load: nothing animates until the person votes. `key`
 * restarts the keyframes on every vote.
 */
type Motion = { pop: 'up' | 'down' | null; roll: 'up' | 'down' | null; key: number }

const BUTTON =
  'tap inline-flex size-8 items-center justify-center rounded-full outline-none hover:bg-surface focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:opacity-60'

/**
 * The prototype's vote pill (H-15): ▲ score ▼, 136×38 with 32px buttons. Pressing the active
 * arrow removes the vote. The change shows at once (useOptimistic); if the Server Action fails,
 * React drops the optimistic value, the score goes back and the pill says why. Without a session
 * nothing is marked: the account modal opens instead (specs/guest-experience G-04).
 */
export function VoteControl({ postId, score, viewerVote }: { postId: string } & Vote) {
  const t = useTranslations('feed.vote')
  const tc = useTranslations('feed.card')
  const format = useFormatter()
  const [confirmed, setConfirmed] = useState<Vote>({ score, viewerVote })
  const [shown, setShown] = useOptimistic(confirmed)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [motion, setMotion] = useState<Motion>({ pop: null, roll: null, key: 0 })
  const { requireAccount, openGate } = useAuthGate()

  function vote(direction: 1 | -1) {
    // aria-disabled, not disabled, while saving: the focused button keeps the focus (WCAG 2.4.3).
    if (pending || !requireAccount('vote-post')) return
    const next = shown.viewerVote === direction ? null : direction
    const nextScore = shown.score - (shown.viewerVote ?? 0) + (next ?? 0)
    setError(null)
    setMotion((last) => ({
      pop: next === 1 ? 'up' : next === -1 ? 'down' : null,
      roll: nextScore > shown.score ? 'up' : nextScore < shown.score ? 'down' : null,
      key: last.key + 1,
    }))
    startTransition(async () => {
      setShown({ score: nextScore, viewerVote: next })
      const result = await votePost({ postId, value: next })
      if (result.ok) {
        // Removing answers 204 without a score: the computed one stands.
        setConfirmed({ score: result.data.score ?? nextScore, viewerVote: result.data.viewerVote })
      } else if (result.error === 'api.errors.UNAUTHENTICATED') {
        // The session ended meanwhile (the action checks it too, security.md § 5).
        openGate('vote-post')
      } else {
        setError(t('error'))
      }
    })
  }

  const voteName = shown.viewerVote === 1 ? 'up' : shown.viewerVote === -1 ? 'down' : 'none'

  return (
    <>
      <span
        data-animate={motion.pop ?? undefined}
        className="inline-flex h-9.5 items-center gap-0.5 rounded-full border bg-card p-0.5 type-action text-muted-foreground"
      >
        <button
          type="button"
          aria-label={t('up')}
          aria-pressed={shown.viewerVote === 1}
          aria-disabled={pending || undefined}
          onClick={() => vote(1)}
          className={BUTTON}
        >
          <ArrowBigUpIcon
            key={motion.pop === 'up' ? motion.key : 'still'}
            aria-hidden
            className={cn(
              'size-4.5',
              shown.viewerVote === 1 && 'fill-current text-foreground',
              motion.pop === 'up' && 'animate-vote-pop',
            )}
          />
        </button>
        <span
          aria-live="polite"
          className="min-w-6 overflow-hidden px-1 text-center font-bold text-foreground tabular-nums"
        >
          <span
            key={motion.key}
            aria-hidden
            className={cn(
              'inline-block',
              motion.roll === 'up' && 'animate-count-up',
              motion.roll === 'down' && 'animate-count-down',
            )}
          >
            {format.number(shown.score, countFormat(shown.score))}
          </span>
          <span className="sr-only">{tc('score', { score: shown.score, vote: voteName })}</span>
        </span>
        <button
          type="button"
          aria-label={t('down')}
          aria-pressed={shown.viewerVote === -1}
          aria-disabled={pending || undefined}
          onClick={() => vote(-1)}
          className={BUTTON}
        >
          <ArrowBigDownIcon
            key={motion.pop === 'down' ? motion.key : 'still'}
            aria-hidden
            className={cn(
              'size-4.5',
              shown.viewerVote === -1 && 'fill-current text-foreground',
              motion.pop === 'down' && 'animate-vote-pop',
            )}
          />
        </button>
      </span>
      {error && (
        <p role="alert" className="type-meta text-destructive">
          {error}
        </p>
      )}
    </>
  )
}
