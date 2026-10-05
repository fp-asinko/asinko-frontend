import { screen } from '@testing-library/react'
import { ThemeProvider } from 'next-themes'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { MenuSettings } from './menu-settings'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

describe('MenuSettings', () => {
  it('offers the language and the theme inside the menu panel on phones', () => {
    renderWithIntl(
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <MenuSettings />
      </ThemeProvider>,
    )
    expect(screen.getByRole('combobox', { name: 'Language' })).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Dark mode' })).toBeInTheDocument()
  })
})
