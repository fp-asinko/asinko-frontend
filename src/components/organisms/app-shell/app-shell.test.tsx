import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from 'next-themes'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { AppShell } from './app-shell'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

function renderShell(right?: ReactNode) {
  return renderWithIntl(
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <AppShell
        navItems={[{ href: '/', label: 'Home', icon: <svg /> }]}
        sidebar={<p>Your interests</p>}
        right={right}
      >
        <h1>Page</h1>
      </AppShell>
    </ThemeProvider>,
  )
}

describe('AppShell', () => {
  it('opens and folds the left column from its toggle, starting as the cookie said (specs/sidebar-toggle)', async () => {
    renderWithIntl(
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <AppShell navItems={[]} sidebar={<a href="#x">A group</a>} leftFolded>
          <h1>Page</h1>
        </AppShell>
      </ThemeProvider>,
    )
    const toggle = screen.getByRole('button', { name: 'Your interests' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(document.getElementById(toggle.getAttribute('aria-controls')!)).toBeInTheDocument()

    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    // Folding with the focus in the column: it comes back to the toggle.
    screen.getByRole('link', { name: 'A group' }).focus()
    await userEvent.click(toggle)
    expect(toggle).toHaveFocus()
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    document.cookie = 'asinko-left-column=; path=/; max-age=0'
  })

  it('starts with a skip link to the main content (F-26)', async () => {
    const user = userEvent.setup()
    renderShell()
    await user.tab()
    const skip = screen.getByRole('link', { name: 'Skip to content' })
    expect(skip).toHaveFocus()
    expect(skip).toHaveAttribute('href', '#content')
  })

  it('renders the page inside the main landmark', () => {
    renderShell()
    const main = screen.getByRole('main')
    expect(main).toHaveAttribute('id', 'content')
    expect(main).toContainElement(screen.getByRole('heading', { name: 'Page' }))
  })

  it('renders the sidebar content in the left column (H-06)', () => {
    renderShell()
    expect(screen.getByText('Your interests')).toBeInTheDocument()
  })

  it('has the banner, the bottom navigation and the menu button', () => {
    renderShell()
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument()
  })

  it('renders the right column as a named complementary region (RC-01, RC-04)', () => {
    renderShell(<p>Season tokens</p>)
    const aside = screen.getByRole('complementary', { name: 'Related' })
    expect(aside).toContainElement(screen.getByText('Season tokens'))
  })

  it('has no empty region when there is no right column', () => {
    renderShell()
    expect(screen.queryByRole('complementary')).toBeNull()
  })
})
