import { ArrowDownIcon, ArrowUpIcon, CheckIcon, XIcon } from 'lucide-react'
import { useFormatter, useNow, useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { thesisPrice } from '@/lib/theses/price'
import { cn } from '@/lib/utils'
import type { ThesisItem } from '../feed.types'

/** The theses' prices (cents only below $1,000). */
function usePrice() {
  const format = useFormatter()
  return (value: number) => thesisPrice(format, value)
}

/**
 * What a thesis bets on, on its page (specs/thesis-detail TD-07, TD-08): the reference price, the
 * target with its distance, the deadline to the minute and how long it has left, and the
 * conviction; then where it stands, once it is no longer open. The only place of these numbers on
 * the page: the summary above says only the claim (PO 2026-11-03). Text first: the arrows and the
 * ✓ / ✗ go with their words.
 */
export function ThesisBet({ thesis }: { thesis: ThesisItem }) {
  const t = useTranslations('feed.thesis.bet')
  const now = useNow()
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
                {t(`direction.${thesis.target.direction}`, {
                  price: price(thesis.target.price),
                  hasChange: change === null ? 'no' : 'yes',
                  change:
                    change === null
                      ? ''
                      : format.number(change, {
                          style: 'percent',
                          maximumFractionDigits: 1,
                          signDisplay: 'exceptZero',
                        }),
                })}
              </span>
            ),
          },
        ]
      : []),
    {
      label: t('deadline'),
      // And how long it has left, while it is open: the one place that says it (PO 2026-11-03).
      value: t(thesis.state === 'open' ? 'deadlineLeft' : 'deadlineAt', {
        date: format.dateTime(new Date(thesis.deadline), {
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
        left: format.relativeTime(new Date(thesis.deadline), now),
      }),
    },
    {
      label: t('conviction'),
      value: (
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="flex gap-0.5">
            {[1, 2, 3, 4].map((bar) => (
              <span
                key={bar}
                className={cn(
                  'h-3 w-1.5 rounded-sm',
                  bar <= thesis.conviction ? 'bg-foreground' : 'bg-border-strong',
                )}
              />
            ))}
          </span>
          {ts(`conviction.${thesis.conviction}`)}
        </span>
      ),
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
      {/* Where it stands, when there is news: an open one says it in its deadline. */}
      {thesis.state !== 'open' && <ThesisStanding thesis={thesis} />}
    </section>
  )
}

/** Where it stands (TD-08): one line per state, from a table rather than chained ifs. */
function ThesisStanding({ thesis }: { thesis: ThesisItem }) {
  const t = useTranslations('feed.thesis.standing')
  const format = useFormatter()
  const price = usePrice()
  const day = (iso: string) => format.dateTime(new Date(iso), { dateStyle: 'medium' })

  const lines: Record<ThesisItem['state'], () => ReactNode> = {
    // Its deadline row says how long it has left (ThesisBet): no line of its own.
    open: () => null,
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
