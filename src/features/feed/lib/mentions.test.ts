// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { RawEntity } from '@/lib/api/contract'
import { markDraftMentions, markMentions, parseMention, type MentionLookup } from './mentions'

const lookup: MentionLookup = {
  communityOfAsset: (id) => ({ 'asset-btc': 'BTC' })[id],
  communitySlug: (id) => ({ 'community-defi': 'defi' })[id],
}

function entity(body: string, raw: string, type: RawEntity['type'], resolvedId: string): RawEntity {
  const start = body.indexOf(raw)
  return { type, raw, resolvedId, position: [start, start + raw.length] }
}

describe('markMentions', () => {
  const body = 'Long $BTC, read #defi and ask @maria.'

  it('turns each mention into an asinko: link, keeping the rest of the text', () => {
    const marked = markMentions(
      body,
      [
        entity(body, '$BTC', 'TICKER', 'asset-btc'),
        entity(body, '#defi', 'COMMUNITY', 'community-defi'),
        entity(body, '@maria', 'MENTION', 'user-maria'),
      ],
      lookup,
    )
    expect(marked).toBe(
      'Long [$BTC](asinko:asset/BTC), read [#defi](asinko:community/defi) and ask [@maria](asinko:user/maria).',
    )
  })

  it('marks an asset without a community as a ticker (highlighted, no link)', () => {
    const text = 'What about $XYZ?'
    expect(markMentions(text, [entity(text, '$XYZ', 'TICKER', 'asset-xyz')], lookup)).toBe(
      'What about [$XYZ](asinko:ticker)?',
    )
  })

  it('leaves unknown communities as plain text', () => {
    const text = 'See #gone'
    expect(markMentions(text, [entity(text, '#gone', 'COMMUNITY', 'community-gone')], lookup)).toBe(
      text,
    )
  })

  it('ignores entities whose offsets do not match their text or overlap', () => {
    const text = 'Long $BTC now'
    const wrong: RawEntity = {
      type: 'TICKER',
      raw: '$BTC',
      resolvedId: 'asset-btc',
      position: [0, 4],
    }
    const outOfRange: RawEntity = { ...wrong, position: [20, 24] }
    const ok = entity(text, '$BTC', 'TICKER', 'asset-btc')
    const overlapping: RawEntity = { ...ok, raw: 'g $B', position: [3, 7] }
    expect(markMentions(text, [wrong, outOfRange], lookup)).toBe(text)
    expect(markMentions(text, [ok, overlapping], lookup)).toBe('Long [$BTC](asinko:asset/BTC) now')
  })

  it('returns the body untouched without entities', () => {
    expect(markMentions(body, undefined, lookup)).toBe(body)
    expect(markMentions(body, [], lookup)).toBe(body)
  })
})

describe('parseMention', () => {
  it('reads back the links made by markMentions', () => {
    expect(parseMention('asinko:asset/BTC')).toEqual({ type: 'asset', slug: 'BTC' })
    expect(parseMention('asinko:ticker')).toEqual({ type: 'ticker' })
    expect(parseMention('asinko:user/maria')).toEqual({ type: 'user', username: 'maria' })
    expect(parseMention('asinko:person')).toEqual({ type: 'person' })
  })

  it('rejects anything else', () => {
    expect(parseMention('https://example.com')).toBeNull()
    expect(parseMention('asinko:community/../admin')).toBeNull()
    expect(parseMention('asinko:other')).toBeNull()
    expect(parseMention(undefined)).toBeNull()
  })
})

describe('markDraftMentions (specs/submit-tools ST-02)', () => {
  it('turns each mention of a draft into one without a page: bold, no link', () => {
    expect(markDraftMentions('Ask @maria about $BTC in #defi.')).toBe(
      'Ask [@maria](asinko:ticker) about [$BTC](asinko:ticker) in [#defi](asinko:ticker).',
    )
    expect(parseMention('asinko:ticker')).toEqual({ type: 'ticker' })
  })

  it('leaves code as written, and prices are not assets', () => {
    expect(markDraftMentions('Run `echo @maria` for $100')).toBe('Run `echo @maria` for $100')
    expect(markDraftMentions('```\n#defi\n```')).toBe('```\n#defi\n```')
  })
})
