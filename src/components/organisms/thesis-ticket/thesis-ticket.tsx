import { ArrowDownIcon, ArrowUpIcon, CheckIcon, EqualIcon, XIcon } from 'lucide-react'
import { useFormatter, useNow, useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { UserAvatar } from '@/components/molecules/user-avatar'
import { Link } from '@/i18n/navigation'
import { previewProps } from '@/lib/communities/preview'
import { thesisPrice } from '@/lib/theses/price'
import { cn } from '@/lib/utils'
import type { ThesisTicketData } from '@/lib/theses/ticket.types'

const ARROWS = { above: ArrowUpIcon, below: ArrowDownIcon, equals: EqualIcon } as const

/**
 * The target's color by where it goes (PO, 2026-11-05): green up, red down, neutral at a price.
 * Large text (24px, 800): 3:1 on the panel's gray is enough, and the arrow and its word say it too.
 */
const TARGET_COLORS = {
  above: 'text-bullish',
  below: 'text-bearish',
  equals: 'text-foreground',
} as const

/** The bars, written whole (Tailwind only builds what it finds): the chosen level's blue. */
const LEVEL_FILLS = ['bg-level-1', 'bg-level-2', 'bg-level-3', 'bg-level-4'] as const
const BAR_HEIGHTS = ['h-2', 'h-2.5', 'h-3', 'h-3.5'] as const

/**
 * A thesis as a betting ticket (specs/thesis-ticket TK-03 to TK-08): the asset and its logo, the
 * target in green or red by where it goes, with how far it is from the entry price; under them the conviction,
 * and the deadline or, once closed, the result. A panel of its own: what tells a thesis from a
 * post (Q2). Read only, a Server Component.
 *
 * `detail` is the thesis's page (Q4): the entry price's date, the deadline to the minute, and the
 * result beside the deadline. It is the page's only place for these numbers (PO 2026-11-03).
 */
export function ThesisTicket({
  thesis,
  variant = 'card',
}: {
  thesis: ThesisTicketData
  variant?: 'card' | 'detail'
}) {
  const t = useTranslations('thesisTicket')
  const ts = useTranslations('thesisSummary')
  const format = useFormatter()
  const now = useNow()
  const detail = variant === 'detail'
  const price = (value: number) => thesisPrice(format, value)
  const day = (iso: string) => format.dateTime(new Date(iso), { dateStyle: 'medium' })
  const open = thesis.state === 'open'

  const { target, reference } = thesis
  const change =
    target && reference && reference.price > 0
      ? (target.price - reference.price) / reference.price
      : null
  const Arrow = target ? ARROWS[target.direction] : null

  const deadline = (
    <time dateTime={thesis.deadline}>
      {t('left', {
        date: format.dateTime(
          new Date(thesis.deadline),
          detail ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' },
        ),
        left: format.relativeTime(new Date(thesis.deadline), now),
        // How long it has left, only while open.
        hasLeft: open ? 'yes' : 'no',
      })}
    </time>
  )

  const Box = detail ? 'section' : 'div'
  return (
    <Box
      {...(detail ? { 'aria-labelledby': `ticket-${thesis.id}` } : {})}
      className="mt-3 rounded-xl border bg-surface p-4"
    >
      {detail && (
        <h2 id={`ticket-${thesis.id}`} className="sr-only">
          {t('title')}
        </h2>
      )}

      {(thesis.asset || target) && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          {thesis.asset && (
            // The asset and its page (TK-04); its hover card as a mention's.
            <Link
              href={thesis.asset.path}
              {...previewProps('asset', thesis.asset.symbol)}
              className="group/asset flex min-w-0 items-center gap-3 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <UserAvatar
                name={thesis.asset.symbol}
                colorKey={thesis.asset.symbol}
                imageUrl={thesis.asset.logoUrl}
                size="lg"
                className="size-10 shrink-0 rounded-full sm:size-11"
              />
              <span className="flex min-w-0 flex-col">
                <span className="type-post-title font-extrabold group-hover/asset:underline">
                  ${thesis.asset.symbol}
                </span>
                <span className="truncate type-meta text-muted-foreground">
                  {thesis.asset.name}
                </span>
              </span>
            </Link>
          )}
          {target && Arrow && (
            // The target (TK-05): big, in the logo's blue, its arrow said in words.
            <div className="flex flex-col items-start sm:items-end">
              <p
                className={cn(
                  'inline-flex items-center gap-1 text-2xl leading-tight font-extrabold tabular-nums',
                  TARGET_COLORS[target.direction],
                )}
              >
                <Arrow aria-hidden className="size-5" strokeWidth={3} />
                <span className="sr-only">{t(`direction.${target.direction}`)} </span>
                {price(target.price)}
              </p>
              <p className="type-meta text-muted-foreground tabular-nums">
                {reference && change !== null
                  ? t('fromReference', {
                      change: format.number(change, {
                        style: 'percent',
                        maximumFractionDigits: 1,
                        signDisplay: 'exceptZero',
                      }),
                      price: price(reference.price),
                      hasDate: detail && reference.at ? 'yes' : 'no',
                      date: reference.at ? day(reference.at) : '',
                    })
                  : t('noReference')}
              </p>
            </div>
          )}
        </div>
      )}

      <dl
        className={cn(
          'grid grid-cols-2 gap-x-4 gap-y-3',
          (thesis.asset || target) && 'mt-3 border-t pt-3',
        )}
      >
        <Datum label={t('conviction')}>
          <span className="inline-flex items-center gap-2">
            <span aria-hidden className="flex items-end gap-0.5">
              {BAR_HEIGHTS.map((height, index) => (
                <span
                  key={height}
                  className={cn(
                    'w-1.5 rounded-sm',
                    height,
                    index < thesis.conviction
                      ? LEVEL_FILLS[thesis.conviction - 1]
                      : 'bg-border-strong',
                  )}
                />
              ))}
            </span>
            {ts(`conviction.${thesis.conviction}`)}
          </span>
        </Datum>
        {/* Open, the deadline; closed, the result in its place (TK-07). The page shows both. */}
        {(open || detail) && <Datum label={t('deadline')}>{deadline}</Datum>}
        {!open && (
          <Datum label={t('result')} wide={detail}>
            <Standing thesis={thesis} />
          </Datum>
        )}
      </dl>
    </Box>
  )
}

function Datum({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={cn('min-w-0', wide && 'col-span-2')}>
      <dt className="type-section text-muted-foreground">{label}</dt>
      <dd className="mt-1 type-small font-semibold">{children}</dd>
    </div>
  )
}

/** Where a closed thesis stands (TK-07): one line per state, ✓ / ✗ with their words. */
function Standing({ thesis }: { thesis: ThesisTicketData }) {
  const t = useTranslations('thesisTicket.standing')
  const format = useFormatter()
  const day = (iso: string) => format.dateTime(new Date(iso), { dateStyle: 'medium' })

  if (thesis.state === 'correct' || thesis.state === 'incorrect') {
    const Mark = thesis.state === 'correct' ? CheckIcon : XIcon
    return (
      <span data-standing={thesis.state} className="inline-flex items-center gap-1">
        <Mark aria-hidden className="size-3.5 shrink-0" />
        {thesis.resolution
          ? t('resolved', {
              outcome: thesis.state,
              date: day(thesis.resolution.at),
              price:
                thesis.resolution.price === null
                  ? ''
                  : thesisPrice(format, thesis.resolution.price),
              hasPrice: thesis.resolution.price === null ? 'no' : 'yes',
              source: thesis.resolution.source ?? 'unknown',
            })
          : t('resolvedNoDate', { outcome: thesis.state })}
      </span>
    )
  }
  if (thesis.state === 'cancelled') {
    return (
      <span data-standing="cancelled">
        {thesis.cancellation
          ? t('cancelled', {
              date: day(thesis.cancellation.at),
              reason: thesis.cancellation.reason ?? '',
              hasReason: thesis.cancellation.reason ? 'yes' : 'no',
            })
          : t('cancelledNoDate')}
      </span>
    )
  }
  return (
    <span data-standing={thesis.state}>
      {t(thesis.state === 'expired' ? 'expired' : 'disputed')}
    </span>
  )
}
