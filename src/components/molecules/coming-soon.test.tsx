import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { ComingSoon } from './coming-soon'

describe('ComingSoon (H-26)', () => {
  afterEach(() => vi.useRealTimers())

  it('is focusable and announced as unavailable', async () => {
    renderWithIntl(<ComingSoon label="Search">🔍</ComingSoon>)
    const button = screen.getByRole('button', { name: 'Search' })
    expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(button).not.toBeDisabled()

    await userEvent.tab()
    expect(button).toHaveFocus()
  })

  it('says "Coming soon" when activated with the keyboard, then hides it', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderWithIntl(<ComingSoon label="Notifications">🔔</ComingSoon>)

    await user.tab()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('status')).toHaveTextContent('Coming soon')

    act(() => vi.advanceTimersByTime(2100))
    expect(screen.getByRole('status')).toHaveTextContent('')
  })

  it('also responds to clicks', async () => {
    renderWithIntl(<ComingSoon label="Profile">👤</ComingSoon>)
    await userEvent.click(screen.getByRole('button', { name: 'Profile' }))
    expect(screen.getByRole('status')).toHaveTextContent('Coming soon')
  })

  it('moves the bubble inward when a clipping column would cut it', async () => {
    // jsdom has no layout: the column clips from x=0 to 300, the bubble would start at -20.
    const rects = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function (this: HTMLElement) {
        const box = this.getAttribute('role') === 'status' ? [-20, 60] : [0, 300]
        return { left: box[0], right: box[1] } as DOMRect
      })
    renderWithIntl(
      // overflowX, not overflowY: jsdom does not derive one from the other as browsers do.
      <div style={{ overflowX: 'auto' }}>
        <ComingSoon label="Rules">Rules</ComingSoon>
      </div>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Rules' }))
    expect(screen.getByRole('status').style.marginLeft).toBe('24px')
    rects.mockRestore()
  })
})
