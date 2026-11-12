// @vitest-environment node
import { createFormatter } from 'next-intl'
import { describe, expect, it } from 'vitest'
import { formatAssetPrice } from './format-asset-price'

const en = createFormatter({ locale: 'en' })

describe('formatAssetPrice (SA-06, Q1)', () => {
  it('shows crypto, stocks, ETFs and commodities in dollars with two decimals', () => {
    expect(formatAssetPrice(en, 356.04, 'EQUITY')).toBe('$356.04')
    expect(formatAssetPrice(en, 3420.55, 'CRYPTO')).toBe('$3,420.55')
    expect(formatAssetPrice(en, 471.2, 'ETF')).toBe('$471.20')
    expect(formatAssetPrice(en, 2650, 'COMMODITY')).toBe('$2,650.00')
  })

  it('goes compact from 10,000 with one decimal', () => {
    expect(formatAssetPrice(en, 83584.01, 'CRYPTO')).toBe('$83.6K')
    expect(formatAssetPrice(en, 10000, 'CRYPTO')).toBe('$10K')
    expect(formatAssetPrice(en, 9999.5, 'CRYPTO')).toBe('$9,999.50')
  })

  it('shows four decimals below 1', () => {
    expect(formatAssetPrice(en, 0.2105, 'CRYPTO')).toBe('$0.2105')
    expect(formatAssetPrice(en, 0.5, 'CRYPTO')).toBe('$0.50')
  })

  it('shows an index without a currency symbol, two decimals, compact from 10,000', () => {
    expect(formatAssetPrice(en, 5321.41, 'INDEX')).toBe('5,321.41')
    expect(formatAssetPrice(en, 17204.88, 'INDEX')).toBe('17.2K')
  })

  it('shows a currency pair without a currency symbol, four decimals', () => {
    expect(formatAssetPrice(en, 1.1234, 'FOREX')).toBe('1.1234')
    expect(formatAssetPrice(en, 1.12, 'FOREX')).toBe('1.1200')
  })

  it('follows the locale separators', () => {
    const es = createFormatter({ locale: 'es' })
    expect(formatAssetPrice(es, 1.1234, 'FOREX')).toBe('1,1234')
    expect(formatAssetPrice(es, 3420.55, 'INDEX')).toBe('3420,55')
    const pt = createFormatter({ locale: 'pt' })
    expect(formatAssetPrice(pt, 12345.6, 'FOREX')).toBe('12.345,6000')
  })
})
