import { ChartNoAxesColumnIcon, ClockAlertIcon } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'
import { Delta } from '@/components/molecules/delta'
import { EmptyState } from '@/components/organisms/empty-state'
import type { AssetMarket as Market } from '../communities.types'

/**
 * An asset's market data (specs/backend-adoption BK-05, BK-06): its price, always, even when old,
 * and the day's change, with an arrow (never color alone). An old price (priceStale) says so and
 * when it was updated. Without a price, says so (CP-10: never invented numbers). In dollars,
 * except a currency pair (EUR/USD 1.08), which has no currency of its own.
 */
export function AssetMarket({ market }: { market: Market | null }) {
  const t = useTranslations('communities.assetData')
  const format = useFormatter()

  if (!market) {
    return <EmptyState icon={<ChartNoAxesColumnIcon />} title={t('empty')} size="section" />
  }

  const price = format.number(market.price, {
    ...(market.currency ? { style: 'currency', currency: market.currency } : {}),
    // A currency pair, as anything under one, with four decimals (1.0832).
    maximumFractionDigits: market.price < 1 || !market.currency ? 4 : 2,
  })
  return (
    // On white inside the gray box: the change's green only reaches its contrast there
    // (design-system.md § Tokens: green text on white, never on --surface).
    <div className="flex flex-col gap-1 rounded-md border bg-background px-3 py-2.5">
      <p className="flex flex-wrap items-baseline gap-x-2.5">
        <span className="sr-only">{t('price')}</span>
        <span className="text-[1.375rem] leading-[1.3] font-extrabold tabular-nums">{price}</span>
        {market.changePct !== null && <Delta value={market.changePct} className="type-small" />}
      </p>
      {market.stale && (
        <p className="flex items-center gap-1 type-meta text-muted-foreground">
          <ClockAlertIcon aria-hidden className="size-3.5 shrink-0" />
          {/* Out of date always; when, if the backend says it. */}
          {market.updatedAt
            ? t('stale', {
                date: format.dateTime(new Date(market.updatedAt), {
                  day: 'numeric',
                  month: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                }),
              })
            : t('staleUnknown')}
        </p>
      )}
    </div>
  )
}
