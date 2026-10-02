import { ClockAlertIcon } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'
import { Delta } from '@/components/molecules/delta'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import type { AssetTile } from '../interests.types'

/** Prototype tiles: 3-column grid, symbol, daily change, bottom border in the change's color. */
export function AssetTiles({ tiles }: { tiles: AssetTile[] }) {
  const t = useTranslations('interests')
  const format = useFormatter()

  return (
    <ul className="grid grid-cols-3 gap-1.5">
      {tiles.map((tile) => {
        const change = tile.changePct ?? 0
        return (
          <li key={tile.symbol}>
            <Link
              href={{ pathname: '/', query: { comunidad: tile.communitySlug } }}
              aria-label={`${tile.name} (${tile.symbol})`}
              className={cn(
                'flex min-h-[4.75rem] flex-col items-center justify-center gap-0.5 rounded-md border border-b-[3px] bg-card px-1 py-2 text-center outline-none hover:bg-surface focus-visible:ring-3 focus-visible:ring-ring/50',
                change > 0 && 'border-b-bullish',
                change < 0 && 'border-b-bearish',
              )}
            >
              <span aria-hidden className="text-ui font-bold">
                {tile.symbol}
              </span>
              {tile.changePct !== null && <Delta value={tile.changePct} className="text-meta" />}
              {tile.price !== null && (
                <span className="text-[0.625rem] text-muted-foreground tabular-nums">
                  {format.number(tile.price, {
                    style: 'currency',
                    currency: 'USD',
                    notation: tile.price >= 10000 ? 'compact' : 'standard',
                    maximumFractionDigits: tile.price < 1 ? 4 : 2,
                  })}
                </span>
              )}
              {tile.stale && (
                <span className="inline-flex items-center gap-0.5 text-[0.625rem] text-muted-foreground">
                  <ClockAlertIcon aria-hidden className="size-3" />
                  <span className="sr-only">{t('stale')}</span>
                </span>
              )}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
