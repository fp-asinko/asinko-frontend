import { ChevronLeftIcon } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'
import { thesisPrice } from '@/lib/theses/price'
import { thesisProgress } from '@/lib/theses/progress'
import type { ThesisTicketData } from '@/lib/theses/ticket.types'
import { cn } from '@/lib/utils'

/** The bet's color, as its target and its animal (TI-02): written whole for Tailwind. */
const TONES = {
  above: { fill: 'bg-bullish', dot: 'bg-bullish' },
  below: { fill: 'bg-bearish', dot: 'bg-bearish' },
} as const

/**
 * How a thesis is doing (specs/thesis-identity TI-01 to TI-07): a bar from its entry to its target,
 * filled to today's price (or the resolution's, closed), and a line that says it in words. The bar
 * is `aria-hidden`: the words say all of it (TI-16), and in gray, since green text on the ticket's
 * gray does not reach 4.5:1; the color goes in the bar and its dot (3:1). Nothing to measure, nothing
 * drawn. A Server Component.
 */
export function ThesisProgress({ thesis }: { thesis: ThesisTicketData }) {
  const t = useTranslations('thesisTicket.progress')
  const format = useFormatter()
  const progress = thesisProgress(thesis)
  if (!progress || !thesis.target || thesis.target.direction === 'equals') return null

  const tone = TONES[thesis.target.direction]
  const share = progress.kind === 'toward' ? progress.share : progress.kind === 'reached' ? 1 : 0
  const percent = (value: number) =>
    format.number(value, { style: 'percent', maximumFractionDigits: 1 })
  const kind = progress.kind === 'toward' && progress.closed ? 'short' : progress.kind

  const date = (iso: string) => format.dateTime(new Date(iso), { dateStyle: 'medium' })

  return (
    <div
      data-progress={progress.kind}
      data-tone={thesis.target.direction}
      className="mt-4 flex flex-col gap-2"
    >
      {/* Where it is and which way it has to go, in words (PO, 2026-11-05: "12.6% to go" did not
          say it): "Today $89.21 · needs to fall 12.6% more". */}
      <p className="type-meta text-muted-foreground tabular-nums">
        {/* One message: each language orders it and separates it its own way. */}
        {t.rich('line', {
          strong: (chunks) => <strong className="font-semibold text-foreground">{chunks}</strong>,
          closed: progress.closed ? 'yes' : 'no',
          price: thesisPrice(format, progress.price),
          kind,
          direction: thesis.target.direction,
          remaining: progress.kind === 'toward' ? percent(progress.remaining) : '',
          change: progress.kind === 'against' ? percent(Math.abs(progress.change)) : '',
          stale: progress.staleAt ? 'yes' : 'no',
          date: progress.staleAt ? date(progress.staleAt) : '',
        })}
      </p>
      <div aria-hidden className="flex items-center gap-1">
        {/* Against: the dot at the edge, and an arrow out of it (TI-04). */}
        {progress.kind === 'against' && (
          <ChevronLeftIcon className="-ml-1 size-3.5 shrink-0 text-muted-foreground" />
        )}
        <div className="relative h-1.5 flex-1 rounded-full bg-border-strong">
          <div
            className={cn('absolute inset-0 origin-left rounded-full', tone.fill)}
            style={{ transform: `scaleX(${share})` }}
          />
          <span
            className={cn(
              'absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-surface',
              tone.dot,
            )}
            style={{ left: `${share * 100}%` }}
          />
        </div>
      </div>
      {/* What each end is. */}
      <div className="flex justify-between gap-3 type-meta text-muted-foreground tabular-nums">
        <span>{t('entry', { price: thesisPrice(format, progress.entry) })}</span>
        <span>{t('target', { price: thesisPrice(format, progress.target) })}</span>
      </div>
    </div>
  )
}
