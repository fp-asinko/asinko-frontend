import { CandlestickChartIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { BackButton } from '@/components/molecules/back-button'
import { IdentityBanner } from '@/components/molecules/identity-banner'
import { UserAvatar } from '@/components/molecules/user-avatar'
import { EmptyState } from '@/components/organisms/empty-state'
import type { AssetSummary } from '../communities.types'

/**
 * The page of an asset of the catalog that has no community yet (specs/backend-answer-1013 BA-09,
 * Q4): the same top as a community page (banner, logo, $SYMBOL and its name), without members nor
 * Join, and an empty state where the feed goes. No $ link of the catalog ends in a 404 while the
 * backend creates the communities.
 */
export function AssetWithoutCommunity({ asset }: { asset: AssetSummary }) {
  const t = useTranslations('communities.assetOnly')
  return (
    <>
      <header className="border-b px-4 pb-4 sm:px-0">
        {/* -mx: the banner bleeds over the column's gutter, as a community's (CommunityHeader). */}
        <div className="relative -mx-4">
          <IdentityBanner colorKey={asset.symbol} imageUrl={null} className="h-24 md:h-30" />
          <BackButton to="home" className="absolute top-2.5 left-3" />
        </div>
        <UserAvatar
          name={asset.handle}
          colorKey={asset.symbol}
          imageUrl={asset.logoUrl}
          size="xl"
          className="relative -mt-7 size-14 rounded-xl border-3 border-background text-base"
        />
        <div className="mt-2 min-w-0">
          {/* Loose classes, not type-page-title: the prototype's title is 800 (design-system.md). */}
          <h1 className="text-[1.375rem] leading-[1.3] font-extrabold wrap-anywhere">
            {asset.handle}
          </h1>
          <p className="type-meta text-muted-foreground">{asset.name}</p>
        </div>
      </header>
      <EmptyState
        icon={<CandlestickChartIcon />}
        title={t('title', { handle: asset.handle })}
        description={t('body')}
      />
    </>
  )
}
