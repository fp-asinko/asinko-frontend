// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { postExcerpt } from './post-excerpt'

describe('postExcerpt', () => {
  it('turns Markdown into one line of plain text', () => {
    expect(
      postExcerpt(
        '## Why\n\n**Flows** are back, see [the report](https://x.com) and `$BTC`.\n- one',
      ),
    ).toBe('Why Flows are back, see the report and $BTC. one')
  })

  it('keeps the text of asinko mentions', () => {
    expect(postExcerpt('Long [$BTC](asinko:asset/BTC) into [#macro](asinko:community/macro)')).toBe(
      'Long $BTC into #macro',
    )
  })

  it('cuts at a word near 160 characters, with an ellipsis', () => {
    const excerpt = postExcerpt('word '.repeat(60))
    expect(excerpt.length).toBeLessThanOrEqual(160)
    expect(excerpt.endsWith('word…')).toBe(true)
  })
})
