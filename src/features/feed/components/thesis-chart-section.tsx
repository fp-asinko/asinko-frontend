import { getFormatter, getNow, getTranslations } from 'next-intl/server'
import { ThesisChart } from '@/components/organisms/thesis-chart'
import { Skeleton } from '@/components/ui/skeleton'
import { chartGeometry } from '@/lib/theses/chart-geometry'
import { thesisPrice } from '@/lib/theses/price'
import type { ThesisItem } from '../feed.types'
import { getAssetPrices } from '../lib/asset-prices-api'

const DAY = 86_400_000

/**
 * The chart above a thesis's page (specs/thesis-chart CH-01): its asset's prices from its
 * publication to today, or to its close. A secondary section: without a history, or when it cannot
 * be asked, nothing, and the thesis shows the same (CH-06). The words come made from here, so the
 * client part formats nothing.
 */
export async function ThesisChartSection({ thesis }: { thesis: ThesisItem }) {
  const { asset, reference, target } = thesis
  if (!asset || !reference) return null

  // The request's now, as the ticket's (useNow): not Date.now() in a render.
  const now = (await getNow()).getTime()
  const start = reference.at ?? thesis.publishedAt
  const closedAt = thesis.resolution?.at ?? thesis.cancellation?.at ?? null
  const until = Math.min(now, Date.parse(closedAt ?? thesis.deadline))
  const end = new Date(until).toISOString()
  if (!(until > Date.parse(start))) return null

  const [points, t, format] = await Promise.all([
    getAssetPrices(asset.symbol, start, end),
    getTranslations('thesisChart'),
    getFormatter(),
  ])
  if (!points) return null
  const closed = thesis.state !== 'open'
  // A target "at" a price has no level to aim at: only the line and the entry (CH-07).
  const aim = target && target.direction !== 'equals' ? target : null
  const geometry = chartGeometry({
    points,
    entry: reference.price,
    target: aim,
    start,
    end: thesis.deadline,
    closed,
  })
  if (!geometry) return null

  const price = (value: number) => thesisPrice(format, value)
  // Points closer than a day are hourly (P-046): their time too.
  const [first, second] = points
  const short = !!first && !!second && Date.parse(second.at) - Date.parse(first.at) < DAY
  const day = (iso: string) =>
    format.dateTime(
      new Date(iso),
      short
        ? { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }
        : { month: 'short', day: 'numeric' },
    )
  const change = (value: number) =>
    format.number((value - reference.price) / reference.price, {
      style: 'percent',
      maximumFractionDigits: 1,
      signDisplay: 'exceptZero',
    })

  return (
    <ThesisChart
      id={thesis.id}
      geometry={geometry}
      label={t('label', {
        symbol: asset.symbol,
        start: format.dateTime(new Date(start), { dateStyle: 'medium' }),
        entry: price(reference.price),
        price: price(geometry.today.price),
        closed: closed ? 'yes' : 'no',
        hasTarget: aim ? 'yes' : 'no',
        target: aim ? price(aim.price) : '',
        deadline: format.dateTime(new Date(thesis.deadline), { dateStyle: 'medium' }),
      })}
      // The words on the lines; their prices, on the axis (CH-20).
      entry={t('entryLevel')}
      target={aim ? { label: t('targetLevel'), direction: aim.direction } : null}
      entryPrice={price(reference.price)}
      targetPrice={aim ? price(aim.price) : null}
      todayPrice={price(geometry.today.price)}
      ticks={geometry.ticks.map((tick) => price(tick.price))}
      live={!closed}
      axis={{
        // The date alone: the axis has no room for its hour.
        start: format.dateTime(new Date(start), { month: 'short', day: 'numeric' }),
        today: closed ? t('closed') : t('today'),
        // The year too when the deadline is in another one.
        end: format.dateTime(new Date(thesis.deadline), {
          month: 'short',
          day: 'numeric',
          ...(new Date(thesis.deadline).getUTCFullYear() !== new Date(now).getUTCFullYear()
            ? { year: 'numeric' }
            : {}),
        }),
      }}
      scrub={{
        name: t('scrub', { symbol: asset.symbol, hourly: short ? 'yes' : 'no' }),
        todayLabel: closed ? t('closed') : t('today'),
        points: geometry.points.map((point) => ({
          label: t('point', {
            date: day(point.at),
            price: price(point.price),
            change: change(point.price),
          }),
          price: price(point.price),
          change: t('sinceEntry', { change: change(point.price) }),
          trend:
            point.price > reference.price ? 'up' : point.price < reference.price ? 'down' : 'flat',
          date: day(point.at),
        })),
      }}
    />
  )
}

/** The chart's place while it streams in: its height, so nothing jumps (CH-12). */
export function ThesisChartSkeleton() {
  return (
    // The chart's own box and sizes, so the skeleton is as tall as what replaces it.
    <div aria-hidden className="rounded-xl border bg-background p-3 pt-18">
      <Skeleton className="h-44 w-full sm:h-60" />
      <Skeleton className="mt-2 h-4 w-full" />
    </div>
  )
}
