import { ClockAlertIcon } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'
import { Delta } from '@/components/molecules/delta'
import { cn } from '@/lib/utils'
import type { AssetTile } from '../interests.types'
import { CommunityLink } from './community-link'

/**
 * Prototype tiles: 3-column grid, $handle, daily change, bottom border in the change's color.
 * The link's name comes from its content (asset name for screen readers, change, price and the
 * stale warning), so nothing shown only by color or icon is lost (WCAG 1.3.1).
 * Motion (S-02): lifts on hover and focus, presses on tap; the community the feed shows is
 * marked as current (S-04).
 */
export function AssetTiles({ tiles }: { tiles: AssetTile[] }) {
  const t = useTranslations('interests')
  const format = useFormatter()

  return (
    <>
      <p className="mb-1.5 text-right text-[0.5625rem] text-muted-foreground">{t('period')}</p>
      {/* As many rows as the column's height takes (specs/sidebar-fill SF-03): 3, 2, at least 1. */}
      <ul className="grid grid-cols-3 gap-1.25 [&>li:nth-child(n+10)]:hidden column-mid:[&>li:nth-child(n+4)]:hidden column-tall:[&>li:nth-child(n+7)]:hidden">
        {tiles.map((tile) => {
          const change = tile.changePct ?? 0
          return (
            <li key={tile.symbol}>
              <CommunityLink
                href={tile.path}
                className={cn(
                  'flex min-h-19.5 tap flex-col items-center justify-center gap-0.5 rounded-md border border-b-3 bg-card p-1 text-center outline-none hover:-translate-y-0.5 focus-visible:-translate-y-0.5 focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-0',
                  'aria-[current=page]:border-x-foreground aria-[current=page]:border-t-foreground',
                  change > 0 && 'border-b-bullish',
                  change < 0 && 'border-b-bearish',
                )}
              >
                <span className="sr-only">{tile.name}</span>{' '}
                <span className="type-small font-bold">{tile.handle}</span>{' '}
                {tile.changePct !== null && (
                  <Delta value={tile.changePct} className="text-[0.625rem]" />
                )}{' '}
                {tile.price !== null && (
                  <span className="text-[0.625rem] text-muted-foreground tabular-nums">
                    {format.number(tile.price, {
                      style: 'currency',
                      currency: 'USD',
                      notation: tile.price >= 10000 ? 'compact' : 'standard',
                      maximumFractionDigits: tile.price < 1 ? 4 : 2,
                    })}
                  </span>
                )}{' '}
                {tile.stale && (
                  <span className="inline-flex items-center gap-0.5 text-[0.625rem] text-muted-foreground">
                    <ClockAlertIcon aria-hidden className="size-3" />
                    <span className="sr-only">{t('stale')}</span>
                  </span>
                )}
              </CommunityLink>
            </li>
          )
        })}
      </ul>
    </>
  )
}
