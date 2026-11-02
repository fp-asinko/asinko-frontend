'use client'

import { useEffect, useState } from 'react'
import { getAssetQuote } from '../actions/asset-quote.action'
import type { AssetQuote } from '../lib/theses-api'

/**
 * The chosen asset's price, next to a thesis's target (specs/thesis-create TC-05): asked when the
 * asset changes, an older answer dropped. Null while there is none, or when it cannot be read: the
 * form goes on without it.
 */
export function useAssetQuote(symbol: string | null): AssetQuote | null {
  const [quote, setQuote] = useState<AssetQuote | null>(null)
  useEffect(() => {
    if (!symbol) return
    let current = true
    void getAssetQuote(symbol).then(
      (answer) => current && setQuote(answer),
      () => current && setQuote(null),
    )
    return () => {
      current = false
      setQuote(null)
    }
  }, [symbol])
  return quote
}
