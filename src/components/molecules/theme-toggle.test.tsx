import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from 'next-themes'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { ThemeToggle } from './theme-toggle'

function renderToggle() {
  return renderWithIntl(
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <ThemeToggle />
    </ThemeProvider>,
  )
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
  })

  it('is a switch with a translated accessible name (F-21)', () => {
    renderToggle()
    expect(screen.getByRole('switch', { name: 'Dark mode' })).toBeInTheDocument()
  })

  it('starts in light mode (F-19)', () => {
    renderToggle()
    expect(screen.getByRole('switch', { name: 'Dark mode' })).not.toBeChecked()
    expect(document.documentElement).not.toHaveClass('dark')
  })

  it('switches to dark with the keyboard and reports its state (F-20, F-21)', async () => {
    const user = userEvent.setup()
    renderToggle()
    const toggle = screen.getByRole('switch', { name: 'Dark mode' })

    await user.tab()
    expect(toggle).toHaveFocus()
    await user.keyboard(' ')

    expect(toggle).toBeChecked()
    expect(document.documentElement).toHaveClass('dark')
  })

  it('persists the choice', async () => {
    const user = userEvent.setup()
    renderToggle()
    await user.click(screen.getByRole('switch', { name: 'Dark mode' }))
    expect(localStorage.getItem('theme')).toBe('dark')
  })
})
