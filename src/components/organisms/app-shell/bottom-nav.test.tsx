import { screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { BottomNav } from './bottom-nav'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

describe('BottomNav', () => {
  it('is a labelled navigation landmark', () => {
    renderWithIntl(<BottomNav items={[{ href: '/', label: 'Home', icon: <svg /> }]} />)
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument()
  })

  it('shows only the registered destinations (F-23b)', () => {
    renderWithIntl(<BottomNav items={[{ href: '/', label: 'Home', icon: <svg /> }]} />)
    const nav = screen.getByRole('navigation', { name: 'Main navigation' })
    expect(
      within(nav)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Home'])
  })

  it('marks the active item', () => {
    renderWithIntl(<BottomNav items={[{ href: '/', label: 'Home', icon: <svg /> }]} />)
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page')
  })
})
