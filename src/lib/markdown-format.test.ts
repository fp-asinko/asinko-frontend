// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { formatMarkdown, type FormatEdit } from './markdown-format'

/** The text after the edit, with the chosen part between [ and ]. */
function apply(value: string, edit: FormatEdit) {
  const next = value.slice(0, edit.start) + edit.text + value.slice(edit.end)
  const [from, to] = edit.select
  return `${next.slice(0, from)}[${next.slice(from, to)}]${next.slice(to)}`
}

const run = (
  value: string,
  start: number,
  end: number,
  kind: Parameters<typeof formatMarkdown>[3],
) => apply(value, formatMarkdown(value, start, end, kind))

describe('formatMarkdown (specs/submit-tools ST-04)', () => {
  it('wraps what is chosen in bold, italic or code, keeping it chosen', () => {
    expect(run('rates are up', 6, 9, 'bold')).toBe('rates **[are]** up')
    expect(run('rates are up', 6, 9, 'italic')).toBe('rates _[are]_ up')
    expect(run('run npm i', 4, 9, 'code')).toBe('run `[npm i]`')
  })

  it('leaves the caret between the marks without a selection', () => {
    expect(run('Hi ', 3, 3, 'bold')).toBe('Hi **[]**')
    expect(run('', 0, 0, 'italic')).toBe('_[]_')
  })

  it('makes a link of what is chosen, choosing the address to type over', () => {
    expect(run('see the report', 8, 14, 'link')).toBe('see the [report]([https://])')
  })

  it('without text, a link leaves the caret inside its brackets', () => {
    expect(run('see ', 4, 4, 'link')).toBe('see [[]](https://)')
  })

  it('marks every line the selection touches as a list or a quote', () => {
    const value = 'intro\nfirst\nsecond\nend'
    expect(run(value, 8, 14, 'list')).toBe('intro\n- first\n- second[]\nend')
    expect(run(value, 7, 7, 'quote')).toBe('intro\n> first[]\nsecond\nend')
    // A selection that ends at the start of the next line does not take that line.
    expect(run(value, 6, 12, 'list')).toBe('intro\n- first[]\nsecond\nend')
  })
})
