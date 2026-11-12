import type { createFormatter } from 'next-intl'
import type { AssetRow } from '../interests.types'

/** What formats a number: next-intl's useFormatter() or getFormatter(). */
type NumberFormatter = Pick<ReturnType<typeof createFormatter>, 'number'>

/** From here on a price reads compact: $83.6K. */
const COMPACT_FROM = 10_000

/**
 * A price as the sidebar's asset rows say it (specs/sidebar-assets-list SA-06, Q1). The contract
 * carries no currency, so dollars only where the class is quoted in dollars (stocks, ETFs, crypto,
 * commodities); an index is a level and a currency pair a rate, neither a price in dollars.
 */
export function formatAssetPrice(
  format: NumberFormatter,
  price: number,
  assetClass: AssetRow['assetClass'],
): string {
  if (assetClass === 'FOREX') {
    return format.number(price, { minimumFractionDigits: 4, maximumFractionDigits: 4 })
  }
  const compact = price >= COMPACT_FROM
  const currency = assetClass === 'INDEX' ? {} : { style: 'currency' as const, currency: 'USD' }
  if (compact) {
    return format.number(price, {
      ...currency,
      notation: 'compact',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    })
  }
  const digits = assetClass !== 'INDEX' && price < 1 ? 4 : 2
  return format.number(price, {
    ...currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: digits,
  })
}
