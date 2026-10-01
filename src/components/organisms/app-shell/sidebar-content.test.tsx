import { screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { SidebarContent } from './sidebar-content'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

const NAV_ITEMS = [{ href: '/', label: 'Home', icon: <svg /> }]

describe('SidebarContent', () => {
  it('lists only the registered destinations in a labelled navigation (F-23b)', () => {
    renderWithIntl(<SidebarContent navItems={NAV_ITEMS} />)
    const nav = screen.getByRole('navigation', { name: 'Main navigation' })
    expect(
      within(nav)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Home'])
  })

  it('marks the current page', () => {
    renderWithIntl(<SidebarContent navItems={NAV_ITEMS} />)
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page')
  })

  it('shows the communities region with its translated empty state', () => {
    renderWithIntl(<SidebarContent navItems={NAV_ITEMS} />)
    const region = screen.getByRole('region', { name: 'Communities' })
    expect(region).toHaveTextContent('Your communities will appear here.')
  })

  it('adds no heading before the page h1', () => {
    renderWithIntl(<SidebarContent navItems={NAV_ITEMS} />)
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })
})
