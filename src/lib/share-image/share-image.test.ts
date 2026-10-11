// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { clampTitle, shareFonts } from './share-image'

describe('clampTitle (specs/share-preview SP-01)', () => {
  it('keeps a title that fits, with its spaces tidied', () => {
    expect(clampTitle('  The Fed   cuts 25 bps ')).toBe('The Fed cuts 25 bps')
  })

  it('cuts a long title at a word, with an ellipsis and no trailing punctuation', () => {
    const title = 'Whales accumulated 48,000 BTC in two weeks, and the funding rates say otherwise'
    const clamped = clampTitle(title, 40)
    expect(clamped).toBe('Whales accumulated 48,000 BTC in two…')
    expect(clamped.length).toBeLessThanOrEqual(40)
  })

  it('cuts a single long word where it must', () => {
    expect(clampTitle('a'.repeat(50), 20)).toBe(`${'a'.repeat(19)}…`)
  })
})

describe('shareFonts (SP-03)', () => {
  it('loads Figtree regular and bold, once', async () => {
    const fonts = await shareFonts()
    expect(fonts.map((font) => [font.name, font.weight])).toEqual([
      ['Figtree', 400],
      ['Figtree', 700],
    ])
    expect(fonts[0]!.data.byteLength).toBeGreaterThan(10_000)
    expect(shareFonts()).toBe(shareFonts())
  })
})
