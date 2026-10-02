import { screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { BottomNav } from './bottom-nav'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

const ITEMS = [{ href: '/', label: 'Home', icon: <svg /> }]

describe('BottomNav', () => {
  it('has the five items of the prototype in a labelled navigation', () => {
    renderWithIntl(<BottomNav items={ITEMS} />)
    const nav = screen.getByRole('navigation', { name: 'Main navigation' })
    expect(within(nav).getAllByRole('listitem')).toHaveLength(5)
  })

  it('links the registered destinations and marks the active one', () => {
    renderWithIntl(<BottomNav items={ITEMS} />)
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page')
  })

  it('shows the future destinations as unavailable (H-26)', () => {
    renderWithIntl(<BottomNav items={ITEMS} />)
    for (const name of ['Search', 'Create', 'Notif', 'Profile']) {
      expect(screen.getByRole('button', { name })).toHaveAttribute('aria-disabled', 'true')
    }
  })
})
