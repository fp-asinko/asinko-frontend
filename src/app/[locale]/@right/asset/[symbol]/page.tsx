import { RightColumn } from '@/components/organisms/right-column'
// By their paths: the groups' and profiles' pages, which use the feature's index, do not need them.
import { AssetAside } from '@/features/communities/components/asset-aside'
import { getAssetSummary } from '@/features/communities/lib/asset-api'

// The right column of an asset (specs/community-widgets CW-03): its market data. The page asks the
// same asset in this request: it comes once (React's cache). An unknown symbol is the page's 404.
export default async function AssetRight({ params }: PageProps<'/[locale]/asset/[symbol]'>) {
  const { symbol } = await params
  const result = await getAssetSummary(decodeURIComponent(symbol))
  if (!result.ok) return <RightColumn />
  return (
    <RightColumn>
      <AssetAside market={result.data.market} />
    </RightColumn>
  )
}
