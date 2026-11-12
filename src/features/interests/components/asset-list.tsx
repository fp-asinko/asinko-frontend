import { ClockAlertIcon } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'
import { Delta } from '@/components/molecules/delta'
import { UserAvatar } from '@/components/molecules/user-avatar'
import { plainHandle } from '@/lib/plain-handle'
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
                className="group flex min-h-8 min-w-0 flex-1 tap items-center gap-2 rounded-md px-1 py-1 transition-colors duration-150 ease-out outline-none hover:bg-surface focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current=page]:bg-muted hover:[&_.text-bearish]:text-foreground aria-[current=page]:[&_.text-bearish]:text-foreground hover:[&_.text-bullish]:text-foreground aria-[current=page]:[&_.text-bullish]:text-foreground"
              >
                <UserAvatar
                  name={asset.symbol}
                  imageUrl={asset.logoUrl}
                  size="sm"
                  className="size-6 transition-[scale] duration-200 ease-out group-hover:scale-105"
                />
                <span className="sr-only">{asset.name}</span>{' '}
                <span className="min-w-0 flex-1 truncate type-small font-bold">
                  {plainHandle(asset.handle)}
                </span>{' '}
                {asset.stale && (
                  <span className="inline-flex shrink-0 items-center text-muted-foreground">
                    <ClockAlertIcon aria-hidden className="size-3" />
                    <span className="sr-only">{t('stale')}</span>
                  </span>
                )}{' '}
                {asset.price !== null ? (
                  <span className="shrink-0 text-right type-meta text-muted-foreground tabular-nums">
                    {formatAssetPrice(format, asset.price, asset.assetClass)}
                  </span>
                ) : (
                  <span className="shrink-0 text-right type-meta text-muted-foreground">
                    <span aria-hidden>{'—'}</span>
                    <span className="sr-only">{t('noPrice')}</span>
                  </span>
                )}{' '}
                {/* A fixed width keeps the columns even from row to row. */}
                <span className="inline-flex min-w-14 shrink-0 justify-end">
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
