import { useTranslations } from 'next-intl'
import { AsideCard } from '@/components/molecules/aside-card'
import type { AssetMarket as AssetMarketData } from '../communities.types'
import { AssetMarket } from './asset-market'

/**
 * An asset's card in the right column (specs/community-widgets CW-03): its market data, as the
 * box under its header shows it in phones. Without a price, it says so.
 */
export function AssetAside({ market }: { market: AssetMarketData | null }) {
  const t = useTranslations('communities.assetData')
  return (
    <AsideCard id="asset-aside" title={t('title')} className="m-3.5 mb-0">
      <AssetMarket market={market} />
    </AsideCard>
  )
}
