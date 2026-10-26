import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { MobileSidebar } from './mobile-sidebar'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

function renderSidebar() {
  return renderWithIntl(
    <MobileSidebar>
      <section aria-label="Your interests">
        <a href="#bitcoin">Bitcoin</a>
      </section>
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
    // Its name is for screen readers only: nothing to read on screen (PO, 2026-10-26).
    expect(screen.getByText('Menu')).toHaveClass('sr-only')
    expect(screen.getByRole('region', { name: 'Your interests' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Bitcoin' })).toBeInTheDocument()
  })

  it('closes with Escape', async () => {
    const user = userEvent.setup()
    renderSidebar()
    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    await screen.findByRole('dialog')

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    // Focus goes back to the menu button.
    await waitFor(() => expect(screen.getByRole('button', { name: 'Open menu' })).toHaveFocus())
  })

  it('announces that it opens a dialog and its expanded state', async () => {
    const user = userEvent.setup()
    renderSidebar()
    const trigger = screen.getByRole('button', { name: 'Open menu' })
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await user.click(trigger)
    await screen.findByRole('dialog')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })

  it('closes with its translated close button', async () => {
    const user = userEvent.setup()
    renderSidebar()
    await user.click(screen.getByRole('button', { name: 'Open menu' }))

    await user.click(await screen.findByRole('button', { name: 'Close menu' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})
