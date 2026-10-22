import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { StickyColumn } from './sticky-column'

afterEach(() => vi.unstubAllGlobals())

/** jsdom has no layout: the column says its height, and a ResizeObserver lets the test resize it. */
function setup(height: number) {
  const callbacks: Array<() => void> = []
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: () => void) {
        callbacks.push(callback)
      }
      observe() {}
      disconnect() {}
    },
  )
  vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(800)
  const box = { height }
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(() => box.height)
  render(
    <StickyColumn label="Related">
      <p>Cards</p>
    </StickyColumn>,
  )
  return {
    column: screen.getByRole('complementary', { name: 'Related' }),
    resize: (next: number) => {
      box.height = next
      callbacks.forEach((callback) => callback())
    },
  }
}

describe('StickyColumn (PO, 2026-10-21)', () => {
  it('shorter than the screen, it sticks under the top bar', () => {
    const { column } = setup(500)
    expect(column.style.top).toBe('60px')
  })

  it('taller, it sticks when its end reaches the bottom of the screen; again when it grows', () => {
    const { column, resize } = setup(1100)
    expect(column.style.top).toBe('-300px')
    resize(1300)
    expect(column.style.top).toBe('-500px')
  })
})
