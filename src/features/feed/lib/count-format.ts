import type { NumberFormatOptions } from 'next-intl'

/**
 * How the feed shows counts (specs/home/design.md § 8): 10,000 or more read compact (12.4K,
 * 12,4 mil), smaller ones in full like the prototype (2,104). Screen-reader texts keep the full
 * number through their ICU plural.
 */
export function countFormat(value: number): NumberFormatOptions {
  return Math.abs(value) >= 10_000 ? { notation: 'compact', maximumFractionDigits: 1 } : {}
}
