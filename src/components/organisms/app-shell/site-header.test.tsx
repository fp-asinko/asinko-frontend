import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from 'next-themes'
import { describe, expect, it, vi } from 'vitest'
import { AuthGateProvider } from '@/components/organisms/auth-gate'
import { renderWithIntl } from '@/test/render-with-intl'
import { SiteHeader } from './site-header'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

function renderHeader(signedIn = true) {
  return renderWithIntl(
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <AuthGateProvider signedIn={signedIn}>
        <SiteHeader menu={<button type="button">menu</button>} />
      </AuthGateProvider>
    </ThemeProvider>,
  )
}

describe('SiteHeader (H-05)', () => {
  it('is the banner landmark with the logo linking home', () => {
    renderHeader()
    expect(screen.getByRole('banner')).toBeInTheDocument()
    const logo = screen.getByRole('img', { name: 'Asinko, go to home' })
    expect(logo.closest('a')).toHaveAttribute('href', '/')
  })

  it('shows search, tokens, notifications and profile as unavailable (H-26)', () => {
    renderHeader()
    for (const name of ['Search', 'Tokens', 'Notifications', 'Profile']) {
      for (const button of screen.getAllByRole('button', { name })) {
        expect(button).toHaveAttribute('aria-disabled', 'true')
      }
    }
    expect(screen.getByText('Search tickers, theses, creators…')).toBeInTheDocument()
  })

  it('keeps the theme toggle, the language selector (H-27) and the menu slot', () => {
    renderHeader()
    expect(screen.getByRole('switch', { name: 'Dark mode' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Language' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'menu' })).toBeInTheDocument()
  })

  it('offers Log in and Sign up instead of the profile without a session (G-02)', async () => {
    renderHeader(false)
    expect(screen.queryByRole('button', { name: 'Profile' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Sign up' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))
    expect(await screen.findByRole('dialog', { name: 'Log in to Asinko' })).toBeInTheDocument()
  })
})
