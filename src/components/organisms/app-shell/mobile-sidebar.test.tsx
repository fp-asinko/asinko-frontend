import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { MobileSidebar } from './mobile-sidebar'
import { SidebarContent } from './sidebar-content'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

function renderSidebar() {
  return renderWithIntl(
    <MobileSidebar>
      <SidebarContent navItems={[{ href: '/', label: 'Home', icon: <svg /> }]} />
    </MobileSidebar>,
  )
}

describe('MobileSidebar', () => {
  it('opens the panel from the menu button with the keyboard', async () => {
    const user = userEvent.setup()
    renderSidebar()

    await user.tab()
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveFocus()
    await user.keyboard('{Enter}')

    const panel = await screen.findByRole('dialog', { name: 'Menu' })
    expect(panel).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Communities' })).toBeInTheDocument()
  })

  it('closes with Escape', async () => {
    const user = userEvent.setup()
    renderSidebar()
    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    await screen.findByRole('dialog')

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('closes with its translated close button', async () => {
    const user = userEvent.setup()
    renderSidebar()
    await user.click(screen.getByRole('button', { name: 'Open menu' }))

    await user.click(await screen.findByRole('button', { name: 'Close menu' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})
