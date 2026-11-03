import type { createFormatter } from 'next-intl'

/** What formats a number: next-intl's useFormatter() or getFormatter(). */
type NumberFormatter = Pick<ReturnType<typeof createFormatter>, 'number'>

/**
 * A thesis's price as the cards say it (specs/profile-track-record PT-08): "$150,000", "$182.47",
 * "$2.41", cents only below $1,000. The contract carries no currency: dollars, as the catalog.
 */
export function thesisPrice(format: NumberFormatter, value: number): string {
  return format.number(value, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  })
}
