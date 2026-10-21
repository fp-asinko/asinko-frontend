import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FitList } from './fit-list'

/** A ResizeObserver that lets the test say when the list changed size. */
function stubResizeObserver() {
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
  return () => callbacks.forEach((callback) => callback())
}

/** jsdom has no layout: each item says its own column (offsetLeft). */
function place(lefts: number[]) {
  screen.getAllByRole('listitem', { hidden: true }).forEach((item, index) => {
    Object.defineProperty(item, 'offsetLeft', { configurable: true, get: () => lefts[index] })
  })
}

afterEach(() => vi.unstubAllGlobals())

describe('FitList (specs/sidebar-fill SF-02, SF-06)', () => {
  it('hides the items that wrapped out of sight, and shows them again when they fit', () => {
    const resized = stubResizeObserver()
    render(
      <FitList>
        <li>One</li>
        <li>Two</li>
        <li>Three</li>
      </FitList>,
    )
    place([0, 0, 260])
    resized()
    const [one, two, three] = screen.getAllByRole('listitem', { hidden: true })
    expect(one).toBeVisible()
    expect(two).toBeVisible()
    expect(three).not.toBeVisible()

    place([0, 0, 0])
    resized()
    expect(three).toBeVisible()
  })

  it('measures again when an item goes (a joined suggestion), without a resize', async () => {
    stubResizeObserver()
    const { rerender } = render(
      <FitList>
        <li key="1">One</li>
        <li key="2">Two</li>
        <li key="3">Three</li>
      </FitList>,
    )
    // Three no longer fits; once One goes, it does.
    place([0, 0, 260])
    rerender(
      <FitList>
        <li key="2">Two</li>
        <li key="3">Three</li>
      </FitList>,
    )
    place([0, 260])
    await waitFor(() =>
      expect(screen.getAllByRole('listitem', { hidden: true })[1]).not.toBeVisible(),
    )
    place([0, 0])
    rerender(
      <FitList>
        <li key="3">Three</li>
      </FitList>,
    )
    await waitFor(() => expect(screen.getByRole('listitem')).toBeVisible())
  })

  it('shows everything without ResizeObserver (the CSS clips what does not fit)', () => {
    render(
      <FitList>
        <li>One</li>
      </FitList>,
    )
    expect(screen.getByRole('listitem')).toBeVisible()
  })
})
