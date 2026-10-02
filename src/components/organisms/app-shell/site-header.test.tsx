import { screen } from '@testing-library/react'
import { ThemeProvider } from 'next-themes'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { SiteHeader } from './site-header'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

function renderHeader() {
  return renderWithIntl(
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <SiteHeader menu={<button type="button">menu</button>} />
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

  it('keeps the theme toggle and the menu slot', () => {
    renderHeader()
    expect(screen.getByRole('switch', { name: 'Dark mode' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'menu' })).toBeInTheDocument()
  })
})
