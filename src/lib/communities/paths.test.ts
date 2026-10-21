// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { assetSymbolOf, communityPath, mentionOf } from './paths'

describe('paths (specs/backend-answer-1020 BA-10)', () => {
  it("an asset's symbol comes from its name, never from its slug", () => {
    expect(assetSymbolOf({ slug: 'brk-b', name: '$BRK.B' })).toBe('BRK.B')
    expect(assetSymbolOf({ slug: 'xauusd', name: '$XAU/USD' })).toBe('XAU/USD')
    // The mocks name an asset as words: the slug, which there is the symbol.
    expect(assetSymbolOf({ slug: 'BTC', name: 'Bitcoin' })).toBe('BTC')
  })

  it('a community as its mention and its page', () => {
    expect(mentionOf({ type: 'SYSTEM_ASSET', slug: 'xauusd', name: '$XAU/USD' })).toEqual({
      handle: '$XAU/USD',
      path: '/asset/XAU%2FUSD',
    })
    expect(mentionOf({ type: 'SYSTEM_CATEGORY', slug: 'macro', name: 'Macro' })).toEqual({
      handle: '#macro',
      path: '/hub/macro',
    })
    expect(mentionOf({ type: 'PERSONAL_CHANNEL', slug: 'maria', name: '@maria' })).toEqual({
      handle: '@maria',
      path: '/user/maria',
    })
    expect(communityPath('asset', 'BRK.B')).toBe('/asset/BRK.B')
  })
})
