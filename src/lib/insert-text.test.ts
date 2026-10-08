import { describe, expect, it, vi } from 'vitest'
import { insertText } from './insert-text'

function field(value: string, start: number, end = start) {
  const element = document.createElement('textarea')
  element.value = value
  document.body.append(element)
  element.setSelectionRange(start, end)
  return element
}

describe('insertText (specs/emoji-picker EP-03)', () => {
  it('writes at the caret and leaves the caret after it', () => {
    const element = field('Hola mundo', 4)
    insertText(element, ' 🚀')
    expect(element.value).toBe('Hola 🚀 mundo')
    expect(element.selectionStart).toBe(4 + ' 🚀'.length)
  })

  it('replaces the selection, or the range given', () => {
    const selected = field('BTC up', 4, 6)
    insertText(selected, '📈')
    expect(selected.value).toBe('BTC 📈')

    const ranged = field('Long $bt', 8)
    insertText(ranged, '$BTC ', { start: 5, end: 8 })
    expect(ranged.value).toBe('Long $BTC ')
    expect(ranged.selectionStart).toBe(10)
  })

  it('tells the page with an input event, as typing does', () => {
    const element = field('', 0)
    const onInput = vi.fn()
    element.addEventListener('input', onInput)
    insertText(element, '🔥')
    expect(onInput).toHaveBeenCalledOnce()
  })
})
