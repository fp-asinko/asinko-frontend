import { ArrowBigDownIcon, ArrowBigUpIcon } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

/**
 * The prototype's vote pill (▲ score ▼), read-only. Voting replaces it with VoteControl (T-09); the
 * shape is the same so nothing moves.
 */
export function ScorePill({ score, viewerVote }: { score: number; viewerVote: 1 | -1 | null }) {
  const t = useTranslations('feed.card')
  const format = useFormatter()

  return (
    <span className="inline-flex h-9.5 items-center gap-0.5 rounded-full border bg-card p-0.5 type-action text-muted-foreground">
      <span className="inline-flex size-8 items-center justify-center" aria-hidden>
        <ArrowBigUpIcon
          className={cn('size-4.5', viewerVote === 1 && 'fill-current text-foreground')}
        />
      </span>
      <span className="min-w-6 px-1 text-center font-bold text-foreground tabular-nums">
        <span aria-hidden>{format.number(score)}</span>
        <span className="sr-only">
          {t('score', {
            score,
            vote: viewerVote === 1 ? 'up' : viewerVote === -1 ? 'down' : 'none',
          })}
        </span>
      </span>
      <span className="inline-flex size-8 items-center justify-center" aria-hidden>
        <ArrowBigDownIcon
          className={cn('size-4.5', viewerVote === -1 && 'fill-current text-foreground')}
        />
      </span>
    </span>
  )
}
