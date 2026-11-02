'use client'

import { useEffect, useState } from 'react'
import { getAssetQuote } from '../actions/asset-quote.action'
import type { AssetQuote } from '../lib/theses-api'

/**
 * The chosen asset's card data, next to a thesis's target (specs/thesis-create TC-05, TC-22):
 * asked when the asset changes, an older answer dropped. `undefined` while there is no asset or the
 * answer has not come; `null` when it cannot be read: the form goes on without it.
 */
export function useAssetQuote(symbol: string | null): AssetQuote | null | undefined {
  const [answer, setAnswer] = useState<{ symbol: string; quote: AssetQuote | null } | null>(null)
  useEffect(() => {
    if (!symbol) return
    let current = true
    void getAssetQuote(symbol).then(
      (quote) => current && setAnswer({ symbol, quote }),
      () => current && setAnswer({ symbol, quote: null }),
    )
    return () => {
      current = false
    }
  }, [symbol])
  return symbol && answer?.symbol === symbol ? answer.quote : undefined
}
