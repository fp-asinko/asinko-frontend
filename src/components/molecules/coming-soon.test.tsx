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
})
