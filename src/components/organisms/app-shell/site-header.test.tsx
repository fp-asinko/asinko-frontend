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

describe('SiteHeader', () => {
  it('is the banner landmark', () => {
    renderHeader()
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('links the logo to the home page', () => {
    renderHeader()
    const logo = screen.getByRole('img', { name: 'Asinko, go to home' })
    expect(logo.closest('a')).toHaveAttribute('href', '/')
  })

  it('includes the theme toggle and the menu slot', () => {
    renderHeader()
    expect(screen.getByRole('switch', { name: 'Dark mode' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'menu' })).toBeInTheDocument()
  })
})
