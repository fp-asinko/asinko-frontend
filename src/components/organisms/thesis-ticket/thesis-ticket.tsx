import { ArrowDownIcon, ArrowUpIcon, CheckIcon, EqualIcon, XIcon } from 'lucide-react'
import { useFormatter, useNow, useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { UserAvatar } from '@/components/molecules/user-avatar'
import { BearMark, BullMark } from '@/components/ui/stance-marks'
import { Link } from '@/i18n/navigation'
import { previewProps } from '@/lib/communities/preview'
import { thesisPrice } from '@/lib/theses/price'
import { cn } from '@/lib/utils'
import type { ThesisTicketData } from '@/lib/theses/ticket.types'
import { ThesisProgress } from './thesis-progress'
import { ThesisSerial, ThesisStamp } from './thesis-stamp'

const ARROWS = { above: ArrowUpIcon, below: ArrowDownIcon, equals: EqualIcon } as const

/** The bull up, the bear down (specs/thesis-agree AG-19): a graphic, 3:1 is enough. A price, none. */
const STANCE_MARKS = {
  above: <BullMark className="size-4 text-bullish" />,
  below: <BearMark className="size-4 text-bearish" />,
  equals: null,
} as const

/**
 * The target's color by where it goes (PO, 2026-11-05): green up, red down, neutral at a price.
 * Large text (24px, 800): 3:1 on the panel's gray is enough, and the arrow and its word say it too.
 */
const TARGET_COLORS = {
  above: 'text-bullish',
  below: 'text-bearish',
  equals: 'text-foreground',
} as const

/**
 * The percent beside it, small: 4.5:1 on the panel's gray. Green a step darker than the target's
 * (--bullish-text, PO 2026-11-09); the red already reaches it.
 */
const CHANGE_COLORS = {
  above: 'text-bullish-text',
  below: 'text-bearish',
  equals: 'text-foreground',
} as const

/** The bars, written whole (Tailwind only builds what it finds): the chosen level's blue. */
const LEVEL_FILLS = ['bg-level-1', 'bg-level-2', 'bg-level-3', 'bg-level-4'] as const
const BAR_HEIGHTS = ['h-2', 'h-2.5', 'h-3', 'h-3.5'] as const

/**
 * A thesis as a betting ticket (specs/thesis-ticket TK-03 to TK-08): three cells of the same weight,
 * the asset, the conviction and the target in green or red by where it goes, with how far it is from
 * the entry price (PO, 2026-11-06); below, the deadline or, once closed, the result. A panel of its own: what tells a thesis from a
 * post (Q2). Read only, a Server Component.
 *
 * `detail` is the thesis's page (Q4): the entry price's date, the deadline to the minute, and the
 * result beside the deadline. It is the page's only place for these numbers (PO 2026-11-03).
 *
 * `preview` is the confirmation before publishing (specs/thesis-create TC-11, PO 2026-11-06): the
 * ticket as it will be, its asset not a link, so nothing leaves the form.
 */
export function ThesisTicket({
  thesis,
  variant = 'card',
  stateChip,
  author,
}: {
  thesis: ThesisTicketData
  variant?: 'card' | 'detail' | 'preview'
  /** Its author's username, for its number's words (specs/thesis-number TN-04); none on a profile. */
  author?: string | null
  /**
   * The state's chip, beside the deadline while open (PO, 2026-11-05: down here, so the header
   * keeps every post's structure). Closed, the result says it.
   */
  stateChip?: ReactNode
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
  const assetLabel = thesis.asset && (
    <>
      <UserAvatar
        name={thesis.asset.symbol}
        colorKey={thesis.asset.symbol}
        imageUrl={thesis.asset.logoUrl}
        size="sm"
        className="size-6 shrink-0 rounded-full"
      />
      <Value>
        <span className="truncate group-hover/asset:underline">${thesis.asset.symbol}</span>
      </Value>
    </>
  )
  return (
    <Box
      {...(detail ? { 'aria-labelledby': `ticket-${thesis.id}` } : {})}
      // Two stubs perforated between them, as a paper ticket (specs/thesis-identity TI-12): the bet
      // above, its deadline or its result below.
      className="mt-3"
    >
      {detail && (
        <h2 id={`ticket-${thesis.id}`} className="sr-only">
          {t('title')}
        </h2>
      )}

      <div className="ticket-stub-top rounded-t-xl border border-b-0 bg-surface p-4">
        {/* Three cells of the same weight and the same shape (PO, 2026-11-06: the three matter):
            a label, a value at 24px and a gray line. From sm, side by side with a hairline between;
            in a phone, the asset and the target, the conviction below. */}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3 sm:gap-x-0">
          {thesis.asset && (
            // The asset and its page (TK-04); its hover card as a mention's.
            <Cell label={t('asset')} className="sm:pr-4">
              {variant === 'preview' ? (
                <span className="inline-flex min-w-0 items-center gap-2">{assetLabel}</span>
              ) : (
                <Link
                  href={thesis.asset.path}
                  {...previewProps('asset', thesis.asset.symbol)}
                  className="group/asset inline-flex min-w-0 items-center gap-2 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {assetLabel}
                </Link>
              )}
              <Sub>{thesis.asset.name}</Sub>
            </Cell>
          )}
          {/* How sure (TK-06): its bars as tall as the other values, and its place on the scale. */}
          <Cell
            label={t('conviction')}
            className="col-span-2 row-start-2 sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:border-l sm:px-4"
          >
            <Value>
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
            </Value>
            <Sub>{t('convictionScale', { level: thesis.conviction })}</Sub>
          </Cell>
          {target && Arrow && (
            // The target (TK-05): green up or red down, its arrow said in words; its animal on its
            // label (specs/thesis-agree AG-19).
            <Cell
              label={
                <>
                  {STANCE_MARKS[target.direction]}
                  {t('target')}
                </>
              }
              className="col-start-2 row-start-1 sm:col-start-3 sm:border-l sm:pl-4"
            >
              <Value large className={cn('gap-1', TARGET_COLORS[target.direction])}>
                <Arrow aria-hidden className="size-5 shrink-0" strokeWidth={3} />
                {/* On the price's baseline, not centered on it (PO, 2026-11-09). Wraps: in a
                    phone's half width, the percent goes under the price. */}
                <span className="inline-flex min-w-0 flex-wrap items-baseline gap-x-1">
                  <span>
                    <span className="sr-only">{t(`direction.${target.direction}`)} </span>
                    {price(target.price)}
                  </span>
                  {/* How far from the entry, beside the target in its color and smaller (PO,
                      2026-11-09); the entry price below. */}
                  {reference && change !== null && (
                    <span
                      data-change
                      className={cn('text-xs font-bold', CHANGE_COLORS[target.direction])}
                    >
                      {format.number(change, {
                        style: 'percent',
                        maximumFractionDigits: 1,
                        signDisplay: 'exceptZero',
                      })}
                    </span>
                  )}
                </span>
              </Value>
              <Sub>
                {reference && change !== null
                  ? t('fromReference', {
                      price: price(reference.price),
                      hasDate: detail && reference.at ? 'yes' : 'no',
                      date: reference.at ? day(reference.at) : '',
                    })
                  : t('noReference')}
              </Sub>
            </Cell>
          )}
        </dl>

        {/* How it is doing, between the bet and the perforation (specs/thesis-identity Q1). */}
        <ThesisProgress thesis={thesis} />
      </div>

      <div className="ticket-stub-bottom rounded-b-xl border border-t-0 bg-surface px-4 pt-3 pb-4">
        {/* The perforation, between the notches. */}
        <span
          aria-hidden
          className="absolute inset-x-3 top-0 border-t border-dashed border-border-strong"
        />
        {/* Open, the deadline with its state; closed, the result in its place (TK-07). The page
          shows both. Closed, room on the right for the stamp (TI-15). */}
        {thesis.number !== null && (
          // Its number among its author's, printed big and faint on the stub as a ticket's serial
          // (specs/thesis-number TN-02, PO 2026-11-06). The state's stamp, closed, lands over it.
          <ThesisSerial
            number={thesis.number}
            label={t('number', {
              number: thesis.number,
              hasAuthor: author ? 'yes' : 'no',
              author: author ?? '',
            })}
          />
        )}
        <dl className={cn('relative grid grid-cols-2 gap-x-4 gap-y-3', !open && 'sm:pr-32')}>
          {(open || detail) && (
            // Alone while open: the whole width, so "in 3 weeks" does not wrap in a phone.
            <Datum label={t('deadline')} aside={open ? stateChip : undefined} wide={open}>
              {deadline}
            </Datum>
          )}
          {!open && (
            <Datum label={t('result')} wide>
              <Standing thesis={thesis} />
            </Datum>
          )}
        </dl>
        {/* Closed, its stamp (TI-14, Q3): below the result in a phone, in the corner from sm. */}
        <ThesisStamp
          state={thesis.state}
          className="mt-3 sm:absolute sm:right-4 sm:bottom-4 sm:mt-0"
        />
      </div>
    </Box>
  )
}

/** One of the bet's three cells (PO, 2026-11-06): its label, its value, a gray line. */
function Cell({
  label,
  className,
  children,
}: {
  label: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)}>
      <dt className="inline-flex items-center gap-1 type-section text-muted-foreground">{label}</dt>
      <dd className="flex min-w-0 flex-col gap-0.5">{children}</dd>
    </div>
  )
}

/**
 * A cell's value (TK-04 to TK-06): 18px and bold for the asset and the conviction; the target,
 * `large`, at 24px and heavy, the one the bet is about (PO, 2026-11-06: the other two at 24px were
 * too big).
 */
function Value({
  large = false,
  className,
  children,
}: {
  large?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex min-h-8 min-w-0 items-center gap-2 tabular-nums',
        large ? 'text-2xl leading-tight font-extrabold' : 'text-lg leading-tight font-bold',
        className,
      )}
    >
      {children}
    </span>
  )
}

/** The gray line under a cell's value. */
function Sub({ children }: { children: ReactNode }) {
  return <span className="truncate type-meta text-muted-foreground tabular-nums">{children}</span>
}

function Datum({
  label,
  wide,
  aside,
  children,
}: {
  label: string
  wide?: boolean
  /** Beside the label: the open state's chip. */
  aside?: ReactNode
  children: ReactNode
}) {
  return (
    <div className={cn('min-w-0', wide && 'col-span-2')}>
      <dt className="flex items-center gap-2 type-section text-muted-foreground">
        {label}
        {aside && <span className="normal-case">{aside}</span>}
      </dt>
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
