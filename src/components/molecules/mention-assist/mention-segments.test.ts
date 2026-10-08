// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { mentionSegments } from './mention-segments'

const mentions = (text: string) =>
  mentionSegments(text)
    .filter((segment) => segment.mention)
    .map((segment) => segment.text)

describe('mentionSegments (specs/mention-autocomplete MA-12)', () => {
  it('finds the three symbols, at the start, after a space or a new line', () => {
    expect(mentions('$BTC on #defi\n@maria')).toEqual(['$BTC', '#defi', '@maria'])
  })

  it('keeps the whole text, in order', () => {
    const text = 'Long $BTC, ask @maria.'
    expect(mentionSegments(text)).toEqual([
      { text: 'Long ', mention: false },
      { text: '$BTC', mention: true },
      { text: ', ask ', mention: false },
      { text: '@maria', mention: true },
      { text: '.', mention: false },
    ])
    expect(
      mentionSegments(text)
        .map((segment) => segment.text)
        .join(''),
    ).toBe(text)
  })

  it('paints the mention being written', () => {
    expect(mentions('Long $bt')).toEqual(['$bt'])
  })

  it('leaves out prices, bare symbols, words with a symbol inside and too long names', () => {
    expect(mentions('$100 and $ alone, mail@host.com, a#b')).toEqual([])
    expect(mentions(`@${'a'.repeat(33)}`)).toEqual([])
  })

  it('returns nothing for an empty text', () => {
    expect(mentionSegments('')).toEqual([])
  })
})
