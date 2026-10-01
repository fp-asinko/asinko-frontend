import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setPathname } from '@/test/navigation-mock'
import { renderWithIntl } from '@/test/render-with-intl'
import { NavLink } from './nav-link'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

describe('NavLink', () => {
  beforeEach(() => setPathname('/'))

  it('links to its destination with a visible label', () => {
    renderWithIntl(<NavLink href="/" label="Home" icon={<svg />} variant="bar" />)
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
  })

  it('marks the current page with aria-current', () => {
    renderWithIntl(<NavLink href="/" label="Home" icon={<svg />} variant="list" />)
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page')
  })

  it('does not mark other pages as current', () => {
    setPathname('/communities')
    renderWithIntl(<NavLink href="/" label="Home" icon={<svg />} variant="list" />)
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current')
  })
})
