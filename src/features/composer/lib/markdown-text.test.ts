// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { markdownText } from './markdown-text'

describe('markdownText (specs/thesis-create TC-11)', () => {
  it('takes the marks off and keeps the words', () => {
    expect(markdownText('**ETF** flows keep _coming_, see `IBIT`')).toBe(
      'ETF flows keep coming, see IBIT',
    )
  })

  it('keeps a link’s words, and drops bullets, quotes and headings', () => {
    expect(markdownText('## Why\n- [the halving](https://x.dev)\n> supply\n1. demand')).toBe(
      'Why\nthe halving\nsupply\ndemand',
    )
  })

  it('leaves plain text and snake_case alone', () => {
    expect(markdownText('  price_target at 2x  ')).toBe('price_target at 2x')
  })
})
