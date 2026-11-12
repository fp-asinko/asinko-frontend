import { ClockAlertIcon } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'
import { Delta } from '@/components/molecules/delta'
import { HintBubble } from '@/components/molecules/hover-hint'
import { UserAvatar } from '@/components/molecules/user-avatar'
import { plainHandle } from '@/lib/plain-handle'
import { cn } from '@/lib/utils'
import type { AssetRow } from '../interests.types'
import { formatAssetPrice } from '../lib/format-asset-price'
import { CommunityLink } from './community-link'
import { FavoriteOrder } from './favorite-order'
import { FavoriteStar } from './favorite-star'

/**
 * The assets I follow, one compact row each: logo, symbol, price and the day's change
 * (specs/sidebar-assets-list). The link's name comes from its content (asset name, symbol, price,
 * change with its direction and the period), so nothing shown only by color or icon is lost
 * (WCAG 1.3.1). Server Component: the stars and the current-page mark are the column's own client
 * leaves, so it adds no JavaScript.
 */
export function AssetList({ assets, id }: { assets: AssetRow[]; id?: string }) {
  const t = useTranslations('interests')
  const format = useFormatter()

  // Since when the price is old, in the day's own words; without a date, the plain warning.
  const staleLabel = (asset: AssetRow) =>
    asset.priceUpdatedAt
      ? t('priceAsOf', {
          date: format.dateTime(new Date(asset.priceUpdatedAt), { month: 'short', day: 'numeric' }),
        })
      : t('stale')

  return (
    // As many rows as the column's height takes (specs/sidebar-fill SF-03): 8, 5, at least 3.
    // All of them while the section's "more" is open (specs/sidebar-more).
    <ul
      id={id}
      className="flex flex-col gap-0.5 group-has-data-[more=open]/section:[&>li]:flex! column-mid:[&>li:nth-child(n+4)]:hidden column-tall:[&>li:nth-child(n+6)]:hidden [&>li:nth-child(n+9)]:hidden"
    >
      {/* Its star beside the row, as People's (specs/favorites FV-02). Reordered at once, sliding
          (FV-06). */}
      <FavoriteOrder
        itemClassName="group/row flex items-center gap-0.5"
        rows={assets.map((asset) => ({
          slug: asset.communitySlug,
          favorite: asset.favorite,
          node: (
            <>
              <CommunityLink
                href={asset.path}
                className="group/hint group grid min-h-8 min-w-0 flex-1 tap grid-cols-[1.5rem_minmax(0,1fr)_auto_3.25rem] items-center gap-1.5 rounded-md px-1 py-1 transition-colors duration-150 ease-out outline-none hover:bg-surface focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current=page]:bg-muted hover:[&_.text-bearish]:text-foreground aria-[current=page]:[&_.text-bearish]:text-foreground hover:[&_.text-bullish]:text-foreground aria-[current=page]:[&_.text-bullish]:text-foreground"
              >
                <UserAvatar
                  name={asset.symbol}
                  imageUrl={asset.logoUrl}
                  size="sm"
                  className="size-6 transition-[scale] duration-200 ease-out group-hover:scale-105"
                />
                <span className="sr-only">{asset.name}</span>{' '}
                <span className="min-w-0 truncate type-small font-bold">
                  {plainHandle(asset.handle)}
                </span>{' '}
                {/* The price cell: right-aligned, so a stale price's clock, attached to its digits,
                    lands in the same x on every row. */}
                <span className="relative inline-flex items-center justify-end gap-0.5 text-right type-meta tabular-nums">
                  {asset.price === null ? (
                    <>
                      <span aria-hidden className="text-muted-foreground">
                        {'—'}
                      </span>
                      <span className="sr-only">{t('noPrice')}</span>
                    </>
                  ) : (
                    <>
                      {asset.stale && (
                        <>
                          <ClockAlertIcon
                            aria-hidden
                            className="size-3 shrink-0 text-muted-foreground"
                          />
                          <span className="sr-only">{staleLabel(asset)}</span>{' '}
                          <HintBubble label={staleLabel(asset)} align="end" />
                        </>
                      )}
                      <span className={cn('shrink-0', asset.stale && 'text-muted-foreground')}>
                        {formatAssetPrice(format, asset.price, asset.assetClass)}
                      </span>
                    </>
                  )}
                </span>{' '}
                {/* A fixed width keeps the change even from row to row. */}
                <span className="inline-flex justify-end">
                  {asset.changePct !== null && (
                    <Delta value={asset.changePct} className="type-meta" />
                  )}
                </span>{' '}
                {asset.changePct !== null && <span className="sr-only">{t('period')}</span>}
              </CommunityLink>
              <FavoriteStar
                slug={asset.communitySlug}
                handle={asset.handle}
                initial={asset.favorite}
              />
            </>
          ),
        }))}
      />
    </ul>
  )
}
