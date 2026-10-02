'use client'

import { ArrowBigDownIcon, ArrowBigUpIcon } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'
import { useOptimistic, useState, useTransition } from 'react'
import { cn } from '@/lib/utils'
import { votePost } from '../actions/vote-post.action'

type Vote = { score: number; viewerVote: 1 | -1 | null }

const BUTTON =
  'inline-flex size-8 items-center justify-center rounded-full outline-none hover:bg-surface focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60'

/**
 * The prototype's vote pill (H-15): ▲ score ▼, 136×38 with 32px buttons. Pressing the active
 * arrow removes the vote. The change shows at once (useOptimistic); if the Server Action fails,
 * React drops the optimistic value, the score goes back and the pill says why.
 */
export function VoteControl({ postId, score, viewerVote }: { postId: string } & Vote) {
  const t = useTranslations('feed.vote')
  const tc = useTranslations('feed.card')
  const format = useFormatter()
  const [confirmed, setConfirmed] = useState<Vote>({ score, viewerVote })
  const [shown, setShown] = useOptimistic(confirmed)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function vote(direction: 1 | -1) {
    const next = shown.viewerVote === direction ? null : direction
    const nextScore = shown.score - (shown.viewerVote ?? 0) + (next ?? 0)
    setError(null)
    startTransition(async () => {
      setShown({ score: nextScore, viewerVote: next })
      const result = await votePost({ postId, value: next })
      if (result.ok) {
        // Removing answers 204 without a score: the computed one stands.
        setConfirmed({ score: result.data.score ?? nextScore, viewerVote: result.data.viewerVote })
      } else {
        setError(result.error === 'api.errors.UNAUTHENTICATED' ? t('needAccount') : t('error'))
      }
    })
  }

  const voteName = shown.viewerVote === 1 ? 'up' : shown.viewerVote === -1 ? 'down' : 'none'

  return (
    <>
      <span className="inline-flex h-9.5 items-center gap-0.5 rounded-full border bg-card p-0.5 type-action text-muted-foreground">
        <button
          type="button"
          aria-label={t('up')}
          aria-pressed={shown.viewerVote === 1}
          disabled={pending}
          onClick={() => vote(1)}
          className={BUTTON}
        >
          <ArrowBigUpIcon
            aria-hidden
            className={cn('size-4.5', shown.viewerVote === 1 && 'fill-current text-foreground')}
          />
        </button>
        <span
          aria-live="polite"
          className="min-w-6 px-1 text-center font-bold text-foreground tabular-nums"
        >
          <span aria-hidden>{format.number(shown.score)}</span>
          <span className="sr-only">{tc('score', { score: shown.score, vote: voteName })}</span>
        </span>
        <button
          type="button"
          aria-label={t('down')}
          aria-pressed={shown.viewerVote === -1}
          disabled={pending}
          onClick={() => vote(-1)}
          className={BUTTON}
        >
          <ArrowBigDownIcon
            aria-hidden
            className={cn('size-4.5', shown.viewerVote === -1 && 'fill-current text-foreground')}
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
