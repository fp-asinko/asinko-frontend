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
