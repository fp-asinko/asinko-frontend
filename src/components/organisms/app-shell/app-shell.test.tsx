import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from 'next-themes'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { AppShell } from './app-shell'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

function renderShell() {
  return renderWithIntl(
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <AppShell navItems={[{ href: '/', label: 'Home', icon: <svg /> }]}>
        <h1>Page</h1>
      </AppShell>
    </ThemeProvider>,
  )
}

describe('AppShell', () => {
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

  it('has the banner and the navigation landmarks (F-23)', () => {
    renderShell()
    expect(screen.getByRole('banner')).toBeInTheDocument()
    // Sidebar navigation and mobile bottom bar (CSS decides which one is visible).
    expect(screen.getAllByRole('navigation', { name: 'Main navigation' })).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument()
  })
})
