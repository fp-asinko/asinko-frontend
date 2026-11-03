import { ArrowDownIcon, ArrowUpIcon, CheckIcon, XIcon } from 'lucide-react'
import { useFormatter, useNow, useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { ThesisItem } from '../feed.types'

/** "$150,000", "$182.47": cents only below $1,000, as the summary's. */
function usePrice() {
  const format = useFormatter()
  return (value: number) =>
    format.number(value, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: value >= 1000 ? 0 : 2,
    })
}

/**
 * What a thesis bets on, on its page (specs/thesis-detail TD-07, TD-08): the reference price, the
 * target with its distance, the deadline to the minute, the conviction and when it was published;
 * then where it stands. Text first: the arrows and the ✓ / ✗ go with their words.
 */
export function ThesisBet({ thesis }: { thesis: ThesisItem }) {
  const t = useTranslations('feed.thesis.bet')
  const ts = useTranslations('thesisSummary')
  const format = useFormatter()
  const price = usePrice()
  const change =
    thesis.target && thesis.reference && thesis.reference.price > 0
      ? (thesis.target.price - thesis.reference.price) / thesis.reference.price
      : null
  const Arrow = thesis.target?.direction === 'below' ? ArrowDownIcon : ArrowUpIcon

  const rows: { label: string; value: ReactNode }[] = [
    {
      label: t('reference'),
      value: thesis.reference
        ? thesis.reference.at
          ? t('referenceAt', {
              price: price(thesis.reference.price),
              date: format.dateTime(new Date(thesis.reference.at), { dateStyle: 'medium' }),
            })
          : price(thesis.reference.price)
        : t('noReference'),
    },
    ...(thesis.target
      ? [
          {
            label: t('target'),
            value: (
              <span
                className={cn(
                  'inline-flex items-center gap-1 font-semibold',
                  thesis.target.direction === 'below' ? 'text-bearish' : 'text-bullish',
                  thesis.target.direction === 'equals' && 'text-foreground',
                )}
              >
                {thesis.target.direction !== 'equals' && (
                  <Arrow aria-hidden className="size-3.5" strokeWidth={2.5} />
                )}
                {t(`direction.${thesis.target.direction}`, { price: price(thesis.target.price) })}
                {change !== null &&
                  ` · ${format.number(change, {
                    style: 'percent',
                    maximumFractionDigits: 1,
                    signDisplay: 'exceptZero',
                  })}`}
              </span>
            ),
          },
        ]
      : []),
    {
      label: t('deadline'),
      value: format.dateTime(new Date(thesis.deadline), {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    },
    { label: t('conviction'), value: ts(`conviction.${thesis.conviction}`) },
    {
      label: t('published'),
      value: format.dateTime(new Date(thesis.publishedAt), { dateStyle: 'medium' }),
    },
  ]

  return (
    <section aria-labelledby={`bet-${thesis.id}`} className="mt-5 rounded-xl border px-4 py-3.5">
      <h2 id={`bet-${thesis.id}`} className="type-section text-muted-foreground">
        {t('title')}
      </h2>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 type-small">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="text-foreground tabular-nums">{row.value}</dd>
          </div>
        ))}
      </dl>
      <ThesisStanding thesis={thesis} />
    </section>
  )
}

/** Where it stands (TD-08): one line per state, from a table rather than chained ifs. */
function ThesisStanding({ thesis }: { thesis: ThesisItem }) {
  const t = useTranslations('feed.thesis.standing')
  const format = useFormatter()
  const now = useNow()
  const price = usePrice()
  const day = (iso: string) => format.dateTime(new Date(iso), { dateStyle: 'medium' })

  const lines: Record<ThesisItem['state'], () => ReactNode> = {
    open: () => t('open', { when: format.relativeTime(new Date(thesis.deadline), now) }),
    expired: () => t('expired'),
    disputed: () => t('disputed'),
    correct: () => resolved(),
    incorrect: () => resolved(),
    cancelled: () =>
      thesis.cancellation
        ? t('cancelled', {
            date: day(thesis.cancellation.at),
            reason: thesis.cancellation.reason ?? '',
            hasReason: thesis.cancellation.reason ? 'yes' : 'no',
          })
        : t('cancelledNoDate'),
  }

  function resolved() {
    const Mark = thesis.state === 'correct' ? CheckIcon : XIcon
    return (
      <span className="inline-flex items-center gap-1">
        <Mark aria-hidden className="size-3.5" />
        {thesis.resolution
          ? t('resolved', {
              outcome: thesis.state,
              date: day(thesis.resolution.at),
              price: thesis.resolution.price === null ? '' : price(thesis.resolution.price),
              hasPrice: thesis.resolution.price === null ? 'no' : 'yes',
              source: thesis.resolution.source ?? 'unknown',
            })
          : t('resolvedNoDate', { outcome: thesis.state })}
      </span>
    )
  }

  return (
    <p data-standing={thesis.state} className="mt-3 border-t pt-3 type-small font-semibold">
      {lines[thesis.state]()}
    </p>
  )
}
