// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { highlightMatches } from './highlight'

const marked = (text: string, q: string) =>
  highlightMatches(text, q)
    .filter((part) => part.match)
    .map((part) => part.text)

describe('highlightMatches (specs/post-detail-refresh PD-05)', () => {
  it('marks every match, keeping the text whole and as written', () => {
    const text = 'Blobs pay ETH. More blobs, more ETH.'
    expect(marked(text, 'blobs')).toEqual(['Blobs', 'blobs'])
    expect(
      highlightMatches(text, 'eth')
        .map((part) => part.text)
        .join(''),
    ).toBe(text)
  })

  it('ignores accents both ways', () => {
    expect(marked('Énfasis en la acción', 'enfasis')).toEqual(['Énfasis'])
    expect(marked('Accion directa', 'acción')).toEqual(['Accion'])
  })

  it('returns the plain text without a search, and nothing for an empty text', () => {
    expect(highlightMatches('Hello', '  ')).toEqual([{ text: 'Hello', match: false }])
    expect(highlightMatches('', 'x')).toEqual([])
    expect(marked('no match here', 'zz')).toEqual([])
  })
})
