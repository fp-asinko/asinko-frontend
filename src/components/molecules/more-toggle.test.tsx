import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MoreToggle } from './more-toggle'

/** jsdom has no ResizeObserver: one the test fires when the list changes size. */
let resize: () => void = () => {}
class FakeResizeObserver {
  constructor(callback: () => void) {
    resize = callback
  }
  observe() {}
  disconnect() {}
}

function List({ hidden }: { hidden: number }) {
  return (
    <section>
      <ul id="groups">
        {['a', 'b', 'c'].map((item, index) => (
          <li key={item} style={index >= 3 - hidden ? { display: 'none' } : undefined}>
            {item}
          </li>
        ))}
      </ul>
      <MoreToggle controls="groups" section="Groups" more="more" less="less" />
    </section>
  )
}

describe('MoreToggle (specs/sidebar-more)', () => {
  beforeEach(() => vi.stubGlobal('ResizeObserver', FakeResizeObserver))
  afterEach(() => vi.unstubAllGlobals())

  it('is not there while the list shows everything', () => {
    render(<List hidden={0} />)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('is a disclosure of its list, named by what it says and its section (SM-01, SM-03)', async () => {
    render(<List hidden={1} />)
    const more = screen.getByRole('button', { name: 'more: Groups' })
    expect(more).toHaveAttribute('aria-expanded', 'false')
    expect(more).toHaveAttribute('aria-controls', 'groups')
    expect(more).toHaveAttribute('data-more', 'closed')

    // With the keyboard: it opens and becomes "less", the focus stays on it.
    more.focus()
    await userEvent.keyboard('{Enter}')
    const less = screen.getByRole('button', { name: 'less: Groups' })
    expect(less).toHaveAttribute('aria-expanded', 'true')
    expect(less).toHaveAttribute('data-more', 'open')
    expect(less).toHaveFocus()
  })

  it('stays while open, though nothing is hidden then, so it can close again', async () => {
    const { rerender } = render(<List hidden={1} />)
    await userEvent.click(screen.getByRole('button', { name: 'more: Groups' }))
    // Open, the section's CSS shows them all: nothing hidden anymore.
    rerender(<List hidden={0} />)
    act(() => resize())
    await userEvent.click(screen.getByRole('button', { name: 'less: Groups' }))
    // Closed with nothing to hide (a taller window): it goes.
    act(() => resize())
    expect(screen.queryByRole('button')).toBeNull()
  })
})
