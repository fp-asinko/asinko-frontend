// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { activeMention } from './active-mention'

const at = (text: string) => activeMention(text, text.length)

describe('activeMention (specs/mention-autocomplete MA-01, MA-06)', () => {
  it('finds each symbol at the start or after whitespace', () => {
    expect(at('$bt')).toEqual({ kind: 'asset', query: 'bt', start: 0 })
    expect(at('Long #de')).toEqual({ kind: 'community', query: 'de', start: 5 })
    expect(at('cc\n@mar')).toEqual({ kind: 'user', query: 'mar', start: 3 })
  })

  it('takes letters of any language, digits, "_" and "-"', () => {
    expect(at('#trading-on')).toMatchObject({ query: 'trading-on' })
    expect(at('@josé_2')).toMatchObject({ query: 'josé_2' })
  })

  it('waits for the first letter after the symbol (Q2)', () => {
    expect(at('$')).toBeNull()
    expect(at('Long #')).toBeNull()
  })

  it('ends with a space, and ignores symbols inside a word', () => {
    expect(at('$btc ')).toBeNull()
    expect(at('mail@host')).toBeNull()
    expect(at('US$100')).toBeNull()
  })

  it('looks only before the caret', () => {
    expect(activeMention('Long $bt and more', 8)).toEqual({ kind: 'asset', query: 'bt', start: 5 })
    expect(activeMention('Long $bt and more', 12)).toBeNull()
  })

  it('stops looking past 32 characters', () => {
    expect(at(`@${'a'.repeat(33)}`)).toBeNull()
  })
})
